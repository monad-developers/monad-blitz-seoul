"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import deployedContracts from "../../contracts/deployedContracts";
import { EventRepository } from "../../repositories/EventRepository";
import scaffoldConfig from "../../scaffold.config";
import { EventUI } from "../../types/ticket";
import { Address } from "@scaffold-ui/components";
import { createPublicClient, formatEther, http } from "viem";
import { useAccount } from "wagmi";
import { CalendarIcon, MapPinIcon, TicketIcon, WalletIcon } from "@heroicons/react/24/outline";

interface UserTicket {
  tokenId: bigint;
  seatId: string;
  eventId: bigint;
  tierId: bigint;
  price: bigint;
  event: EventUI | null;
}

// Get contract config
const getContractConfig = () => {
  const targetChain = scaffoldConfig.targetNetworks[0];
  const chainId = targetChain.id;
  const contracts = deployedContracts as any;

  if (!contracts[chainId]?.MonadTicketSale) {
    throw new Error("MonadTicketSale contract not found in deployedContracts");
  }

  return {
    address: contracts[chainId].MonadTicketSale.address as `0x${string}`,
    abi: contracts[chainId].MonadTicketSale.abi,
  };
};

// Create a public client
const targetChain = scaffoldConfig.targetNetworks[0];
const publicClient = createPublicClient({
  chain: targetChain,
  transport: http(),
});

export default function MyTicketsPage() {
  const { address: connectedAddress, isConnected } = useAccount();
  const [tickets, setTickets] = useState<UserTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupedTickets, setGroupedTickets] = useState<Map<string, UserTicket[]>>(new Map());

  useEffect(() => {
    if (isConnected && connectedAddress) {
      loadUserTickets();
    } else {
      setLoading(false);
    }
  }, [isConnected, connectedAddress]);

  const loadUserTickets = async () => {
    try {
      setLoading(true);
      const { address, abi } = getContractConfig();

      // Get all events
      const allEvents = await EventRepository.getAllEvents();
      const userTickets: UserTicket[] = [];

      // For each event, check if user has tickets
      for (const event of allEvents) {
        const result = (await publicClient.readContract({
          address,
          abi,
          functionName: "getEventAllSeatsWithStatus",
          args: [event.eventId],
        })) as any;

        const [seatIds, tokenIds, owners, , prices, tierIds] = result;

        // Find tickets owned by user
        for (let i = 0; i < owners.length; i++) {
          if ((owners[i] as string).toLowerCase() === connectedAddress!.toLowerCase()) {
            userTickets.push({
              tokenId: tokenIds[i],
              seatId: seatIds[i],
              eventId: event.eventId,
              tierId: tierIds[i],
              price: prices[i],
              event,
            });
          }
        }
      }

      setTickets(userTickets);

      // Group tickets by event
      const grouped = new Map<string, UserTicket[]>();
      userTickets.forEach(ticket => {
        const eventKey = ticket.eventId.toString();
        if (!grouped.has(eventKey)) {
          grouped.set(eventKey, []);
        }
        grouped.get(eventKey)!.push(ticket);
      });
      setGroupedTickets(grouped);
    } catch (error) {
      console.error("Failed to load user tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6E54FF]/5 via-transparent to-[#85E6FF]/5"></div>
        <div className="absolute top-20 left-10 w-96 h-96 bg-[#6E54FF]/10 rounded-full blur-3xl"></div>

        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="max-w-md mx-auto text-center glass-card-strong p-12 monad-glow">
            <WalletIcon className="h-24 w-24 mx-auto text-base-content/30 mb-6" />
            <h2 className="text-3xl font-bold monad-gradient-text font-mono mb-4">Connect Your Wallet</h2>
            <p className="text-base-content/70 font-mono">Please connect your wallet to view your NFT tickets</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="relative">
          <span className="loading loading-spinner loading-lg text-[#6E54FF]"></span>
          <div className="absolute inset-0 loading loading-spinner loading-lg text-[#85E6FF] opacity-50"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#6E54FF]/5 via-transparent to-[#85E6FF]/5"></div>
      <div className="absolute top-20 left-10 w-96 h-96 bg-[#6E54FF]/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#85E6FF]/10 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-center">
            <span className="monad-gradient-text">My NFT Tickets</span>
          </h1>
          <p className="text-lg text-base-content/70 font-mono text-center mb-6">
            Your blockchain-verified event tickets
          </p>

          {/* Wallet Info */}
          <div className="glass-card-strong p-4 max-w-2xl mx-auto monad-glow">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <WalletIcon className="h-6 w-6 text-[#6E54FF]" />
                <div>
                  <p className="text-xs font-mono text-base-content/70">Connected Wallet</p>
                  <Address address={connectedAddress} />
                </div>
              </div>
              <div className="glass-button px-4 py-2 rounded-lg">
                <p className="text-xs font-mono text-base-content/70">Total Tickets</p>
                <p className="text-2xl font-bold monad-gradient-text font-mono">{tickets.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tickets Display */}
        {tickets.length === 0 ? (
          <div className="text-center py-16 glass-card-strong max-w-md mx-auto monad-glow">
            <TicketIcon className="h-24 w-24 mx-auto text-base-content/30 mb-6" />
            <p className="text-xl text-base-content/70 font-mono mb-2">No tickets yet</p>
            <p className="text-sm text-base-content/50 mb-6">Start collecting NFT tickets for amazing events</p>
            <Link href="/events" className="btn monad-gradient text-white border-none font-mono">
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="space-y-8 max-w-6xl mx-auto">
            {Array.from(groupedTickets.entries()).map(([eventId, eventTickets]) => {
              const event = eventTickets[0].event;
              if (!event) return null;

              const eventDate = new Date(Number(event.eventDate) * 1000);
              const totalValue = eventTickets.reduce((sum, ticket) => sum + parseFloat(formatEther(ticket.price)), 0);

              return (
                <div key={eventId} className="glass-card-strong monad-glow">
                  <div className="card-body">
                    {/* Event Header */}
                    <div className="flex flex-col md:flex-row gap-6 mb-6">
                      <div className="w-full md:w-48 h-48 overflow-hidden rounded-lg">
                        <img
                          src={event.imageUrl}
                          alt={event.name}
                          className="w-full h-full object-cover"
                          onError={e => {
                            (e.target as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400";
                          }}
                        />
                      </div>

                      <div className="flex-1">
                        <h2 className="text-3xl font-bold monad-gradient-text font-mono mb-3">{event.name}</h2>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-base-content/70">
                            <CalendarIcon className="h-5 w-5 text-[#85E6FF]" />
                            <span className="font-mono text-sm">
                              {eventDate.toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-base-content/70">
                            <MapPinIcon className="h-5 w-5 text-[#85E6FF]" />
                            <span className="font-mono text-sm">{event.location}</span>
                          </div>

                          <div className="flex items-center gap-2 text-base-content/70">
                            <TicketIcon className="h-5 w-5 text-[#85E6FF]" />
                            <span className="font-mono text-sm">
                              {eventTickets.length} Ticket{eventTickets.length > 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 glass-button p-3 rounded-lg inline-block">
                          <p className="text-xs font-mono text-base-content/70">Total Value</p>
                          <p className="text-xl font-bold monad-gradient-text font-mono">{totalValue.toFixed(4)} MON</p>
                        </div>
                      </div>
                    </div>

                    {/* Tickets Grid */}
                    <div className="divider"></div>
                    <h3 className="font-bold text-lg monad-gradient-text font-mono mb-4">Your Tickets</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {eventTickets.map(ticket => (
                        <div key={ticket.tokenId.toString()} className="glass-card monad-glow p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="text-xs font-mono text-base-content/70">Seat</p>
                              <p className="text-xl font-bold monad-gradient-text font-mono">{ticket.seatId}</p>
                            </div>
                            <div className="glass-button px-2 py-1 rounded text-xs font-mono">
                              NFT #{ticket.tokenId.toString()}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-mono text-base-content/70">Price Paid</span>
                              <span className="text-sm font-bold font-mono">
                                {parseFloat(formatEther(ticket.price)).toFixed(4)} MON
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-mono text-base-content/70">Tier ID</span>
                              <span className="text-sm font-mono">#{ticket.tierId.toString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
