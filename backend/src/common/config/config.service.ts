import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class ConfigService {
  get(key: string): string {
    return process.env[key] || '';
  }

  getNumber(key: string, defaultValue: number = 0): number {
    const value = process.env[key];
    return value ? parseInt(value, 10) : defaultValue;
  }

  getBoolean(key: string, defaultValue: boolean = false): boolean {
    const value = process.env[key];
    return value ? value.toLowerCase() === 'true' : defaultValue;
  }

  // Blockchain
  get monadRpcUrl(): string {
    return this.get('MONAD_RPC_URL');
  }

  get chainId(): number {
    return this.getNumber('CHAIN_ID');
  }

  get oxGameAddress(): string {
    return this.get('OXGAME_V2_ADDRESS');
  }

  get oraclePrivateKey(): string {
    return this.get('ORACLE_PRIVATE_KEY');
  }

  // Server
  get port(): number {
    return this.getNumber('PORT', 3001);
  }

  // Chainlink Data Streams
  get datastreamsApiKey(): string {
    return this.get('DATASTREAMS_API_KEY');
  }

  get datastreamsApiSecret(): string {
    return this.get('DATASTREAMS_API_SECRET');
  }

  get datastreamsRestUrl(): string {
    return this.get('DATASTREAMS_REST_URL');
  }

  get datastreamsWsUrl(): string {
    return this.get('DATASTREAMS_WS_URL');
  }

  get feedIdEth(): string {
    return this.get('FEED_ID_ETH');
  }

  get feedIdLink(): string {
    return this.get('FEED_ID_LINK');
  }

  get feedIdBtc(): string {
    return this.get('FEED_ID_BTC');
  }
}
