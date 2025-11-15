import deployedContracts from "../contracts/deployedContracts";
import scaffoldConfig from "../scaffold.config";
import { EventUI } from "../types/ticket";
import { createPublicClient, formatEther, http } from "viem";

// Hardcoded UI enhancements for events
const EVENT_UI_DATA: Record<
  string,
  {
    description: string;
    location: string;
    imageUrl: string;
    category: string;
  }
> = {
  "BTS World Tour - Seoul": {
    description: "Experience the electrifying performance of BTS, the biggest K-POP group in the world.",
    location: "Olympic Stadium, Seoul",
    imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800",
    category: "Concert",
  },
  "IU Love Poem Concert": {
    description: "Join IU for an intimate concert featuring her greatest hits and new songs.",
    location: "KSPO Dome, Seoul",
    imageUrl: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800",
    category: "Concert",
  },
  "Monad Rock Festival 2025": {
    description: "Three days of non-stop rock music featuring the best bands from around the world.",
    location: "Nanji Hangang Park, Seoul",
    imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
    category: "Festival",
  },
  "Monad Jazz Night": {
    description: "An intimate evening of smooth jazz in a cozy venue with world-class musicians.",
    location: "Blue Note Seoul",
    imageUrl: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800",
    category: "Concert",
  },
  "Monad Developer Conference 2025": {
    description:
      "Join us for the biggest Monad developer conference. Learn about blockchain technology and network with industry leaders.",
    location: "COEX Convention Center, Seoul",
    imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
    category: "Conference",
  },
};

// Get the contract ABI and address
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

// Create a public client for reading contract data
const targetChain = scaffoldConfig.targetNetworks[0];
const publicClient = createPublicClient({
  chain: targetChain,
  transport: http(),
});

export class EventRepository {
  static async getAllEvents(): Promise<EventUI[]> {
    try {
      const { address, abi } = getContractConfig();

      // Call getAllEvents from contract
      const events = (await publicClient.readContract({
        address,
        abi,
        functionName: "getAllEvents",
        args: [],
      })) as any[];

      // Transform contract events to UI events with hardcoded data
      const eventsUI: EventUI[] = await Promise.all(
        events.map(async event => {
          // Get tiers to find minimum price
          const tiers = (await publicClient.readContract({
            address,
            abi,
            functionName: "getEventTiers",
            args: [event.eventId],
          })) as any[];

          const minPriceBigInt = tiers.reduce(
            (min, tier) => (tier.price < min ? tier.price : min),
            tiers[0]?.price || 0n,
          );
          const minPrice = parseFloat(formatEther(minPriceBigInt));

          const uiData = EVENT_UI_DATA[event.name] || {
            description: "An amazing event you won't want to miss!",
            location: "Seoul, South Korea",
            imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800",
            category: "Event",
          };

          return {
            ...event,
            ...uiData,
            minPrice,
          };
        }),
      );

      return eventsUI;
    } catch (error) {
      console.error("Failed to fetch events from contract:", error);
      // Return empty array on error
      return [];
    }
  }

  static async getEventById(id: string): Promise<EventUI | null> {
    try {
      const eventId = BigInt(id);
      const { address, abi } = getContractConfig();

      const event = (await publicClient.readContract({
        address,
        abi,
        functionName: "events",
        args: [eventId],
      })) as any;

      if (!event || event.eventId === 0n) {
        return null;
      }

      // Get tiers to find minimum price
      const tiers = (await publicClient.readContract({
        address,
        abi,
        functionName: "getEventTiers",
        args: [eventId],
      })) as any[];

      const minPriceBigInt = tiers.reduce((min, tier) => (tier.price < min ? tier.price : min), tiers[0]?.price || 0n);
      const minPrice = parseFloat(formatEther(minPriceBigInt));

      const uiData = EVENT_UI_DATA[event.name] || {
        description: "An amazing event you won't want to miss!",
        location: "Seoul, South Korea",
        imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800",
        category: "Event",
      };

      return {
        ...event,
        ...uiData,
        minPrice,
      };
    } catch (error) {
      console.error("Failed to fetch event:", error);
      return null;
    }
  }

  static async getEventsByCategory(category: string): Promise<EventUI[]> {
    const allEvents = await this.getAllEvents();
    return allEvents.filter(event => event.category === category);
  }

  static async searchEvents(query: string): Promise<EventUI[]> {
    const allEvents = await this.getAllEvents();
    const lowerQuery = query.toLowerCase();
    return allEvents.filter(
      event =>
        event.name.toLowerCase().includes(lowerQuery) ||
        event.description.toLowerCase().includes(lowerQuery) ||
        event.category.toLowerCase().includes(lowerQuery) ||
        event.location.toLowerCase().includes(lowerQuery),
    );
  }
}
