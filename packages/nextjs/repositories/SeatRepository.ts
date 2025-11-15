import { Seat, Reservation } from "../types/ticket";

const MOCK_SEATS: Record<string, Seat[]> = {};

const generateSeatsForEvent = (eventId: string, totalSeats: number): Seat[] => {
  if (MOCK_SEATS[eventId]) {
    return MOCK_SEATS[eventId];
  }

  const seats: Seat[] = [];
  const sections = ["VIP", "A", "B", "C"];
  const seatsPerSection = Math.ceil(totalSeats / sections.length);
  const prices: Record<string, number> = {
    VIP: 0.1,
    A: 0.08,
    B: 0.05,
    C: 0.03,
  };

  let seatId = 1;

  sections.forEach(section => {
    const rowsInSection = Math.ceil(seatsPerSection / 10);

    for (let row = 1; row <= rowsInSection; row++) {
      for (let num = 1; num <= 10; num++) {
        if (seatId > totalSeats) break;

        const randomStatus = Math.random();
        let status: "available" | "reserved" | "sold" = "available";

        if (randomStatus < 0.2) {
          status = "sold";
        } else if (randomStatus < 0.3) {
          status = "reserved";
        }

        seats.push({
          id: `${eventId}-seat-${seatId}`,
          eventId,
          section,
          row,
          number: num,
          price: prices[section],
          status,
        });

        seatId++;
      }
    }
  });

  MOCK_SEATS[eventId] = seats;
  return seats;
};

const MOCK_RESERVATIONS: Map<string, Reservation> = new Map();

export class SeatRepository {
  static async getSeatsByEventId(eventId: string): Promise<Seat[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    if (!MOCK_SEATS[eventId]) {
      generateSeatsForEvent(eventId, 500);
    }

    return [...MOCK_SEATS[eventId]];
  }

  static async getSeatsBySection(eventId: string, section: string): Promise<Seat[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const seats = await this.getSeatsByEventId(eventId);
    return seats.filter(seat => seat.section === section);
  }

  static async reserveSeats(eventId: string, seatIds: string[]): Promise<Reservation> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const seats = await this.getSeatsByEventId(eventId);
    const selectedSeats = seats.filter(seat => seatIds.includes(seat.id) && seat.status === "available");

    if (selectedSeats.length !== seatIds.length) {
      throw new Error("Some seats are no longer available");
    }

    selectedSeats.forEach(seat => {
      seat.status = "reserved";
    });

    const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
    const reservation: Reservation = {
      id: `rsv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      eventId,
      seats: selectedSeats,
      totalPrice,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    };

    MOCK_RESERVATIONS.set(reservation.id, reservation);

    return reservation;
  }

  static async getReservation(reservationId: string): Promise<Reservation | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return MOCK_RESERVATIONS.get(reservationId) || null;
  }

  static async cancelReservation(reservationId: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const reservation = MOCK_RESERVATIONS.get(reservationId);
    if (!reservation) {
      return false;
    }

    const seats = MOCK_SEATS[reservation.eventId];
    if (seats) {
      reservation.seats.forEach(reservedSeat => {
        const seat = seats.find(s => s.id === reservedSeat.id);
        if (seat && seat.status === "reserved") {
          seat.status = "available";
        }
      });
    }

    MOCK_RESERVATIONS.delete(reservationId);
    return true;
  }
}
