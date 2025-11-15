// Contract Event struct mapping
export interface Event {
  eventId: bigint;
  issuer: string;
  name: string;
  eventDate: bigint;
  tierCount: bigint;
  totalTickets: bigint;
  soldTickets: bigint;
  isActive: boolean;
  createdAt: bigint;
}

// Extended Event for UI with hardcoded data
export interface EventUI {
  eventId: bigint;
  issuer: string;
  name: string;
  eventDate: bigint;
  tierCount: bigint;
  totalTickets: bigint;
  soldTickets: bigint;
  isActive: boolean;
  createdAt: bigint;
  // Hardcoded UI fields
  description: string;
  location: string;
  imageUrl: string;
  category: string;
  minPrice: number;
}

// Contract Tier struct mapping
export interface Tier {
  tierId: bigint;
  eventId: bigint;
  name: string;
  price: bigint;
  totalCount: bigint;
  soldCount: bigint;
  startTokenId: bigint;
  createdAt: bigint;
}

// Seat structure for UI
export interface Seat {
  seatId: string;
  tokenId: bigint;
  eventId: bigint;
  tierId: bigint;
  owner: string;
  isAvailable: boolean;
  price: bigint;
  // Parsed data for UI
  section: string;
  row: number;
  number: number;
  status: "available" | "reserved" | "sold";
}

export interface Reservation {
  id: string;
  eventId: string;
  seats: Seat[];
  totalPrice: number;
  createdAt: Date;
  expiresAt: Date;
}

export interface PaymentRequest {
  reservationId: string;
  paymentMethod: "credit_card" | "wallet";
  amount: number;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  message: string;
}
