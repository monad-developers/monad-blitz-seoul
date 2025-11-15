"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Event, Seat } from "../../../types/ticket";
import { EventRepository } from "../../../repositories/EventRepository";
import { SeatRepository } from "../../../repositories/SeatRepository";
import { SeatMap } from "../../../components/ticketing/SeatMap";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function SeatsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [eventData, seatsData] = await Promise.all([
        EventRepository.getEventById(eventId),
        SeatRepository.getSeatsByEventId(eventId),
      ]);

      if (!eventData) {
        router.push("/events");
        return;
      }

      setEvent(eventData);
      setSeats(seatsData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeatSelect = (seatId: string) => {
    setSelectedSeats(prev => {
      if (prev.includes(seatId)) {
        return prev.filter(id => id !== seatId);
      }
      return [...prev, seatId];
    });
  };

  const handleReserve = async () => {
    if (selectedSeats.length === 0) return;

    try {
      setReserving(true);
      const reservation = await SeatRepository.reserveSeats(eventId, selectedSeats);
      router.push(`/payment?reservationId=${reservation.id}`);
    } catch (error) {
      console.error("Failed to reserve seats:", error);
      alert("Failed to reserve seats. Please try again.");
      await loadData();
    } finally {
      setReserving(false);
    }
  };

  const selectedSeatObjects = seats.filter(seat => selectedSeats.includes(seat.id));
  const totalPrice = selectedSeatObjects.reduce((sum, seat) => sum + seat.price, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#6E54FF]/5 via-transparent to-[#85E6FF]/5"></div>
      <div className="absolute top-20 right-10 w-96 h-96 bg-[#6E54FF]/10 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="mb-6">
          <Link href="/events" className="glass-button px-4 py-2 rounded-lg gap-2 inline-flex items-center font-mono">
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Events
          </Link>
        </div>

        <div className="mb-8 glass-card p-6">
          <h1 className="text-4xl font-bold mb-2 monad-gradient-text">{event.title}</h1>
          <p className="text-base-content/80 font-mono text-sm">{event.location}</p>
          <p className="text-sm text-base-content/60 font-mono">
            {new Date(event.date).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <SeatMap seats={seats} selectedSeats={selectedSeats} onSeatSelect={handleSeatSelect} />
          </div>

          <div className="lg:col-span-1">
            <div className="glass-card-strong sticky top-4 monad-glow">
              <div className="card-body">
                <h2 className="card-title monad-gradient-text font-mono">Order Summary</h2>

                {selectedSeatObjects.length === 0 ? (
                  <p className="text-base-content/70 text-sm font-mono">No seats selected</p>
                ) : (
                  <div className="space-y-2">
                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {selectedSeatObjects.map(seat => (
                        <div key={seat.id} className="flex justify-between text-sm glass-button p-2 rounded">
                          <span className="font-mono">
                            {seat.section}-{seat.row}-{seat.number}
                          </span>
                          <span className="font-semibold font-mono">{seat.price} ETH</span>
                        </div>
                      ))}
                    </div>

                    <div className="divider my-2"></div>

                    <div className="flex justify-between items-center">
                      <span className="font-semibold font-mono">Selected Seats:</span>
                      <span className="text-lg font-mono monad-gradient-text font-bold">
                        {selectedSeatObjects.length}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xl font-bold">
                      <span className="font-mono">Total:</span>
                      <span className="monad-gradient-text font-mono">{totalPrice.toFixed(4)} ETH</span>
                    </div>
                  </div>
                )}

                <div className="card-actions justify-end mt-4">
                  <button
                    onClick={handleReserve}
                    disabled={selectedSeats.length === 0 || reserving}
                    className="btn monad-gradient text-white border-none w-full font-mono hover:monad-glow-strong"
                  >
                    {reserving ? (
                      <>
                        <span className="loading loading-spinner"></span>
                        Reserving...
                      </>
                    ) : (
                      "Proceed to Payment"
                    )}
                  </button>
                </div>

                <div className="glass-button p-4 rounded-lg mt-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="stroke-current shrink-0 w-6 h-6 text-[#85E6FF] mx-auto mb-2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <span className="text-xs font-mono block text-center">Seats reserved for 10 minutes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
