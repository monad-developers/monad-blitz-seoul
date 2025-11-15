import { Event } from "../types/ticket";

const MOCK_EVENTS: Event[] = [
  {
    id: "evt-001",
    title: "Monad Developer Conference 2025",
    description: "Join us for the biggest Monad developer conference of the year. Learn about the latest developments in blockchain technology.",
    date: "2025-12-15T19:00:00Z",
    location: "Seoul Convention Center",
    imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
    price: 0.05,
    totalSeats: 500,
    availableSeats: 342,
    category: "Conference",
  },
  {
    id: "evt-002",
    title: "K-POP Live Concert: NOVA",
    description: "Experience the electrifying performance of NOVA, the hottest K-POP group of 2025.",
    date: "2025-11-20T18:00:00Z",
    location: "Olympic Stadium",
    imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800",
    price: 0.08,
    totalSeats: 1000,
    availableSeats: 156,
    category: "Concert",
  },
  {
    id: "evt-003",
    title: "Web3 Gaming Summit",
    description: "Explore the future of gaming with blockchain technology. Network with industry leaders.",
    date: "2025-11-25T10:00:00Z",
    location: "COEX Hall A",
    imageUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800",
    price: 0.03,
    totalSeats: 300,
    availableSeats: 287,
    category: "Gaming",
  },
  {
    id: "evt-004",
    title: "NFT Art Exhibition",
    description: "Discover the most innovative NFT artworks from renowned digital artists worldwide.",
    date: "2025-12-01T14:00:00Z",
    location: "Seoul Art Museum",
    imageUrl: "https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=800",
    price: 0.02,
    totalSeats: 200,
    availableSeats: 95,
    category: "Art",
  },
  {
    id: "evt-005",
    title: "DeFi Investment Workshop",
    description: "Learn advanced DeFi strategies from top traders and protocol developers.",
    date: "2025-11-30T13:00:00Z",
    location: "Gangnam Business Center",
    imageUrl: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800",
    price: 0.04,
    totalSeats: 150,
    availableSeats: 78,
    category: "Workshop",
  },
  {
    id: "evt-006",
    title: "Blockchain Security Conference",
    description: "Deep dive into blockchain security, smart contract auditing, and best practices.",
    date: "2025-12-10T09:00:00Z",
    location: "Tech Hub Seoul",
    imageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800",
    price: 0.06,
    totalSeats: 400,
    availableSeats: 221,
    category: "Conference",
  },
];

export class EventRepository {
  static async getAllEvents(): Promise<Event[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...MOCK_EVENTS];
  }

  static async getEventById(id: string): Promise<Event | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return MOCK_EVENTS.find(event => event.id === id) || null;
  }

  static async getEventsByCategory(category: string): Promise<Event[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return MOCK_EVENTS.filter(event => event.category === category);
  }

  static async searchEvents(query: string): Promise<Event[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const lowerQuery = query.toLowerCase();
    return MOCK_EVENTS.filter(
      event =>
        event.title.toLowerCase().includes(lowerQuery) ||
        event.description.toLowerCase().includes(lowerQuery) ||
        event.category.toLowerCase().includes(lowerQuery),
    );
  }
}
