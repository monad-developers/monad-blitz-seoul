import { PaymentRequest, PaymentResponse, Reservation } from "../types/ticket";
import { SeatRepository } from "./SeatRepository";

const MOCK_PAYMENTS: Map<string, PaymentResponse> = new Map();

export class PaymentRepository {
  static async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    await new Promise(resolve => setTimeout(resolve, 1500));

    const reservation = await SeatRepository.getReservation(request.reservationId);

    if (!reservation) {
      return {
        success: false,
        message: "Reservation not found",
      };
    }

    if (reservation.expiresAt < new Date()) {
      await SeatRepository.cancelReservation(request.reservationId);
      return {
        success: false,
        message: "Reservation has expired",
      };
    }

    if (Math.abs(reservation.totalPrice - request.amount) > 0.0001) {
      return {
        success: false,
        message: "Payment amount does not match reservation total",
      };
    }

    const shouldFail = Math.random() < 0.05;

    if (shouldFail) {
      return {
        success: false,
        message: "Payment processing failed. Please try again.",
      };
    }

    const transactionId = `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const response: PaymentResponse = {
      success: true,
      transactionId,
      message: "Payment successful",
    };

    MOCK_PAYMENTS.set(transactionId, response);

    return response;
  }

  static async getPaymentStatus(transactionId: string): Promise<PaymentResponse | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return MOCK_PAYMENTS.get(transactionId) || null;
  }

  static async refundPayment(transactionId: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const payment = MOCK_PAYMENTS.get(transactionId);
    if (!payment || !payment.success) {
      return false;
    }

    const shouldFail = Math.random() < 0.1;
    return !shouldFail;
  }
}
