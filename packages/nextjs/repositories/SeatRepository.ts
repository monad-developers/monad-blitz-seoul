import deployedContracts from "../contracts/deployedContracts";
import scaffoldConfig from "../scaffold.config";
import { Reservation, Seat } from "../types/ticket";
import { createPublicClient, formatEther, http } from "viem";

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

// Parse seat ID to extract section, row, and number
// Format: "VIP-A01", "STD-B02", "CONF-001" etc.
const parseSeatId = (seatId: string): { section: string; row: number; number: number } => {
  // Extract section (e.g., "VIP", "STD", "ECO", "CONF")
  const parts = seatId.split("-");
  const section = parts[0] || "A";

  // Extract row and number from second part
  const seatPart = parts[1] || "A01";
  const rowLetter = seatPart.charAt(0);

  // Check if first character is a letter (A-Z) or digit (0-9)
  if (/[A-Z]/i.test(rowLetter)) {
    // Format: "A01", "B02" -> row: A=1, B=2, etc.
    const row = rowLetter.toUpperCase().charCodeAt(0) - 64; // A=1, B=2, etc.
    const number = parseInt(seatPart.substring(1)) || 1;
    return { section, row, number };
  } else {
    // Format: "001", "002", "100" -> all in row 1, number: 1, 2, 100
    const row = 1;
    const number = parseInt(seatPart) || 1;
    return { section, row, number };
  }
};

const MOCK_RESERVATIONS: Map<string, Reservation> = new Map();

export class SeatRepository {
  static async getSeatsByEventId(eventId: string): Promise<Seat[]> {
    try {
      const eventIdBigInt = BigInt(eventId);
      const { address, abi } = getContractConfig();

      // Get all seats with status from contract
      const result = (await publicClient.readContract({
        address,
        abi,
        functionName: "getEventAllSeatsWithStatus",
        args: [eventIdBigInt],
      })) as any;

      const [seatIds, tokenIds, owners, availabilities, prices, tierIds] = result;

      // Transform to Seat objects
      const seats: Seat[] = seatIds.map((seatId: string, index: number) => {
        const { section, row, number } = parseSeatId(seatId);
        const owner = owners[index] as string;
        const isAvailable = availabilities[index] as boolean;

        // Determine status based on owner
        let status: "available" | "reserved" | "sold" = "available";
        if (!isAvailable) {
          status = "sold";
        }

        return {
          seatId,
          tokenId: tokenIds[index],
          eventId: eventIdBigInt,
          tierId: tierIds[index],
          owner,
          isAvailable,
          price: prices[index],
          section,
          row,
          number,
          status,
        };
      });

      return seats;
    } catch (error) {
      console.error("Failed to fetch seats from contract:", error);
      return [];
    }
  }

  static async getSeatsBySection(eventId: string, section: string): Promise<Seat[]> {
    const seats = await this.getSeatsByEventId(eventId);
    return seats.filter(seat => seat.section === section);
  }

  static async reserveSeats(eventId: string, seatIds: string[]): Promise<Reservation> {
    // This is a mock reservation system
    // In a real implementation, this would interact with the contract
    await new Promise(resolve => setTimeout(resolve, 500));

    const seats = await this.getSeatsByEventId(eventId);
    const selectedSeats = seats.filter(seat => seatIds.includes(seat.seatId) && seat.status === "available");

    if (selectedSeats.length !== seatIds.length) {
      throw new Error("Some seats are no longer available");
    }

    const totalPrice = selectedSeats.reduce((sum, seat) => {
      return sum + parseFloat(formatEther(seat.price));
    }, 0);

    const reservation: Reservation = {
      id: `rsv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      eventId,
      seats: selectedSeats as any, // Type mismatch with old Seat interface
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

    MOCK_RESERVATIONS.delete(reservationId);
    return true;
  }
}
