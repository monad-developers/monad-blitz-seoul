import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '../common/config/config.service';
import { ChainType, ChainTypeNames } from '../common/constants/chain-types';
import { createClient, decodeReport, LogLevel } from '@chainlink/data-streams-sdk';

interface PriceData {
  asset: string;
  price: number;
  timestamp: number;
}

interface DecodedReport {
  price?: bigint;
  benchmarkPrice?: bigint;
  nativeBenchmarkPrice?: bigint;
  midPrice?: bigint;
  exchangeRate?: bigint;
  navPerShare?: bigint;
  tokenizedPrice?: bigint;
  marketStatus?: string;
  [key: string]: unknown;
}

@Injectable()
export class ChainlinkService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ChainlinkService.name);
  private client: any;
  private streams: Map<ChainType, any> = new Map();

  // Price cache
  private priceCache: Map<ChainType, { price: number; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5000; // 5 seconds

  // Feed IDs mapping
  private feedIds: Map<ChainType, string> = new Map();

  constructor(private configService: ConfigService) {
    // Initialize feed IDs - ETH only
    this.feedIds.set(ChainType.ETH, this.configService.feedIdEth);
    // this.feedIds.set(ChainType.LINK, this.configService.feedIdLink);
    // this.feedIds.set(ChainType.BTC, this.configService.feedIdBtc);
  }

  async onModuleInit() {
    await this.initializeDataStreams();
  }

  async onModuleDestroy() {
    await this.disconnectStreams();
  }

  /**
   * Initialize Chainlink Data Streams WebSocket client
   */
  private async initializeDataStreams() {
    try {
      this.logger.log('📡 Initializing Chainlink Data Streams WebSocket...');

      const apiKey = this.configService.datastreamsApiKey;
      const userSecret = this.configService.datastreamsApiSecret;
      const endpoint = this.configService.datastreamsRestUrl;
      const wsEndpoint = this.configService.datastreamsWsUrl;

      // Debug log credentials (partially masked for security)
      this.logger.debug(`API Key: ${apiKey?.substring(0, 8)}...${apiKey?.substring(apiKey.length - 4)}`);
      this.logger.debug(`Secret: ${userSecret ? `${userSecret.substring(0, 8)}...(${userSecret.length} chars)` : 'NOT SET'}`);
      this.logger.debug(`REST URL: ${endpoint}`);
      this.logger.debug(`WS URL: ${wsEndpoint}`);

      // Create Chainlink Data Streams client
      this.client = createClient({
        apiKey,
        userSecret,
        endpoint,
        wsEndpoint,
        logging: {
          logger: console,
          logLevel: LogLevel.INFO, // INFO level for debugging
        },
      });

      // Create streams for each chain type
      for (const [chainType, feedId] of this.feedIds.entries()) {
        await this.createStream(chainType, feedId);
      }

      this.logger.log('✅ Chainlink Data Streams WebSocket initialized');
    } catch (error: any) {
      this.logger.error(`Failed to initialize Data Streams: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create WebSocket stream for a specific feed
   */
  private async createStream(chainType: ChainType, feedId: string) {
    try {
      const stream = this.client.createStream([feedId]);

      // Handle incoming reports
      stream.on('report', (report: any) => {
        try {
          const decoded = decodeReport(report.fullReport, report.feedID) as unknown as DecodedReport;

          // Extract price from various possible fields
          const priceRawCandidates = [
            decoded.price,
            decoded.benchmarkPrice,
            decoded.nativeBenchmarkPrice,
            decoded.midPrice,
            decoded.exchangeRate,
            decoded.navPerShare,
            decoded.tokenizedPrice,
          ];

          const priceRaw = priceRawCandidates.find((value) => typeof value !== 'undefined');

          if (!priceRaw) {
            this.logger.warn(`No price data found in report for ${ChainTypeNames[chainType]}`);
            return;
          }

          // Convert price from BigInt to number (18 decimals)
          const price = Number(priceRaw) / 1e18;

          if (isNaN(price)) {
            this.logger.error(`Invalid price data for ${ChainTypeNames[chainType]}`);
            return;
          }

          const timestampValue = Date.now();

          // Update cache
          this.priceCache.set(chainType, {
            price,
            timestamp: timestampValue,
          });

          this.logger.debug(
            `📊 ${ChainTypeNames[chainType]}: $${price.toFixed(2)} (Market: ${decoded.marketStatus || 'n/a'})`,
          );
        } catch (error: any) {
          this.logger.error(`Failed to decode report for ${ChainTypeNames[chainType]}: ${error.message}`);
        }
      });

      // Handle stream errors
      stream.on('error', (error: any) => {
        this.logger.error(`Stream error for ${ChainTypeNames[chainType]}: ${error.message}`);
      });

      // Connect to stream
      await stream.connect();
      this.streams.set(chainType, stream);

      this.logger.log(`✅ Connected to ${ChainTypeNames[chainType]} feed (${feedId})`);
    } catch (error: any) {
      this.logger.error(`Failed to create stream for ${ChainTypeNames[chainType]}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Disconnect all streams
   */
  private async disconnectStreams() {
    this.logger.log('Disconnecting Chainlink Data Streams...');

    for (const [chainType, stream] of this.streams.entries()) {
      try {
        await stream.disconnect();
        this.logger.log(`Disconnected ${ChainTypeNames[chainType]} stream`);
      } catch (error: any) {
        this.logger.error(`Failed to disconnect ${ChainTypeNames[chainType]} stream: ${error.message}`);
      }
    }

    this.streams.clear();
  }

  /**
   * Get latest price (from cache)
   */
  async getLatestPrice(chainType: ChainType): Promise<PriceData> {
    const cached = this.priceCache.get(chainType);

    if (!cached) {
      throw new Error(`No price data available for ${ChainTypeNames[chainType]}`);
    }

    // Check if cache is stale (older than CACHE_DURATION)
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.logger.warn(
        `Price data for ${ChainTypeNames[chainType]} is stale (${Math.round((Date.now() - cached.timestamp) / 1000)}s old)`,
      );
    }

    return {
      asset: ChainTypeNames[chainType],
      price: cached.price,
      timestamp: cached.timestamp,
    };
  }

  /**
   * Detect price change
   */
  detectPriceChange(startPrice: number, endPrice: number): boolean {
    return endPrice > startPrice;
  }
}
