export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  imageUrl: string;
  price: number;
  totalSeats: number;
  availableSeats: number;
  category: string;
}

export interface Seat {
  id: string;
  eventId: string;
  section: string;
  row: number;
  number: number;
  price: number;
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
