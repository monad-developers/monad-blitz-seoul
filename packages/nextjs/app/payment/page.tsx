"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Reservation, PaymentRequest } from "../../types/ticket";
import { SeatRepository } from "../../repositories/SeatRepository";
import { PaymentRepository } from "../../repositories/PaymentRepository";
import { EventRepository } from "../../repositories/EventRepository";
import { PaymentForm } from "../../components/ticketing/PaymentForm";
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reservationId = searchParams.get("reservationId");

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [eventTitle, setEventTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  useEffect(() => {
    if (!reservationId) {
      router.push("/events");
      return;
    }
    loadReservation();
  }, [reservationId]);

  useEffect(() => {
    if (!reservation) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(reservation.expiresAt).getTime();
      const remaining = Math.max(0, expiry - now);

      setTimeRemaining(remaining);

      if (remaining === 0) {
        handleExpiration();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [reservation]);

  const loadReservation = async () => {
    try {
      setLoading(true);
      const data = await SeatRepository.getReservation(reservationId!);

      if (!data) {
        router.push("/events");
        return;
      }

      setReservation(data);

      const event = await EventRepository.getEventById(data.eventId);
      if (event) {
        setEventTitle(event.title);
      }
    } catch (error) {
      console.error("Failed to load reservation:", error);
      router.push("/events");
    } finally {
      setLoading(false);
    }
  };

  const handleExpiration = async () => {
    alert("Your reservation has expired. Please select seats again.");
    router.push(`/seats/${reservation?.eventId}`);
  };

  const handlePayment = async (request: PaymentRequest) => {
    try {
      setPaymentError(null);
      const response = await PaymentRepository.processPayment(request);

      if (response.success) {
        setPaymentSuccess(true);
        setTransactionId(response.transactionId || null);
      } else {
        setPaymentError(response.message);
      }
    } catch (error) {
      console.error("Payment error:", error);
      setPaymentError("An unexpected error occurred. Please try again.");
    }
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!reservation) {
    return null;
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6E54FF]/10 via-transparent to-[#85E6FF]/10"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#6E54FF]/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#85E6FF]/20 rounded-full blur-3xl animate-pulse"></div>

        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="max-w-2xl mx-auto">
            <div className="glass-card-strong monad-glow-strong">
              <div className="card-body text-center">
                <CheckCircleIcon className="h-24 w-24 mx-auto monad-gradient-text" />
                <h2 className="text-3xl font-bold mt-4 monad-gradient-text font-mono">Payment Successful!</h2>
                <p className="text-base-content/70 font-mono">Your tickets have been confirmed.</p>

                {transactionId && (
                  <div className="glass-card p-4 mt-4">
                    <p className="text-sm text-base-content/70 font-mono mb-2">Transaction ID</p>
                    <p className="font-mono text-xs break-all monad-gradient-text font-bold">{transactionId}</p>
                  </div>
                )}

                <div className="divider"></div>

                <div className="text-left space-y-3">
                  <h3 className="font-bold text-lg monad-gradient-text font-mono">Order Details</h3>
                  <div className="glass-button p-3 rounded-lg">
                    <span className="font-semibold font-mono text-sm">Event:</span>
                    <span className="font-mono text-sm ml-2">{eventTitle}</span>
                  </div>
                  <div className="glass-button p-3 rounded-lg">
                    <span className="font-semibold font-mono text-sm">Seats:</span>
                    <span className="font-mono text-sm ml-2">{reservation.seats.length}</span>
                  </div>
                  <div className="glass-card p-3 rounded max-h-40 overflow-y-auto">
                    {reservation.seats.map(seat => (
                      <div key={seat.id} className="text-sm font-mono">
                        Section {seat.section}, Row {seat.row}, Seat {seat.number}
                      </div>
                    ))}
                  </div>
                  <div className="glass-card-strong p-4 monad-glow">
                    <p className="text-xl font-bold monad-gradient-text font-mono">
                      Total Paid: {reservation.totalPrice.toFixed(4)} ETH
                    </p>
                  </div>
                </div>

                <div className="card-actions justify-center mt-6">
                  <Link href="/events" className="btn monad-gradient text-white border-none btn-lg font-mono">
                    Browse More Events
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#6E54FF]/5 via-transparent to-[#85E6FF]/5"></div>
      <div className="absolute top-20 left-10 w-96 h-96 bg-[#6E54FF]/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#85E6FF]/10 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="mb-6">
          <Link
            href={`/seats/${reservation.eventId}`}
            className="glass-button px-4 py-2 rounded-lg gap-2 inline-flex items-center font-mono"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Seat Selection
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="mb-8 glass-card p-6">
            <h1 className="text-4xl font-bold mb-3 monad-gradient-text font-mono">Complete Your Purchase</h1>
            <div className="flex items-center gap-2">
              <div className="text-base-content/70 font-mono text-sm">Time remaining:</div>
              <div
                className={`font-mono text-2xl font-bold ${
                  timeRemaining < 60000
                    ? "text-[#FF8EE4] animate-pulse monad-glow"
                    : "monad-gradient-text"
                }`}
              >
                {formatTime(timeRemaining)}
              </div>
            </div>
          </div>

          {paymentError && (
            <div className="glass-card-strong p-4 mb-6 border border-[#FF8EE4]/50">
              <div className="flex items-center gap-3">
                <XCircleIcon className="h-6 w-6 text-[#FF8EE4]" />
                <span className="font-mono">{paymentError}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="glass-card-strong">
                <div className="card-body">
                  <h2 className="card-title monad-gradient-text font-mono mb-4">Payment Details</h2>
                  <PaymentForm
                    totalAmount={reservation.totalPrice}
                    onSubmit={handlePayment}
                    reservationId={reservationId!}
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="glass-card-strong sticky top-4 monad-glow">
                <div className="card-body">
                  <h2 className="card-title monad-gradient-text font-mono">Order Summary</h2>

                  <div className="space-y-3 mt-4">
                    <p className="font-semibold font-mono glass-button p-3 rounded">{eventTitle}</p>

                    <div className="divider my-2"></div>

                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {reservation.seats.map(seat => (
                        <div key={seat.id} className="flex justify-between text-sm glass-button p-2 rounded">
                          <span className="font-mono">
                            {seat.section}-{seat.row}-{seat.number}
                          </span>
                          <span className="font-semibold font-mono">{seat.price} ETH</span>
                        </div>
                      ))}
                    </div>

                    <div className="divider my-2"></div>

                    <div className="flex justify-between items-center glass-button p-3 rounded">
                      <span className="font-semibold font-mono">Total Seats:</span>
                      <span className="text-lg font-mono monad-gradient-text font-bold">
                        {reservation.seats.length}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xl font-bold glass-card p-4">
                      <span className="font-mono">Total:</span>
                      <span className="monad-gradient-text font-mono">{reservation.totalPrice.toFixed(4)} ETH</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
