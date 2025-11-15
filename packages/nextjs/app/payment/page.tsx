"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Reservation } from "../../types/ticket";
import { SeatRepository } from "../../repositories/SeatRepository";
import { EventRepository } from "../../repositories/EventRepository";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  WalletIcon,
  ClockIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  BoltIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { Address } from "@scaffold-ui/components";
import { formatEther } from "viem";
import deployedContracts from "../../contracts/deployedContracts";
import { hardhat } from "viem/chains";

// Get contract config
const getContractConfig = () => {
  const chainId = hardhat.id;
  const contracts = deployedContracts as any;

  if (!contracts[chainId]?.MonadTicketSale) {
    throw new Error("MonadTicketSale contract not found in deployedContracts");
  }

  return {
    address: contracts[chainId].MonadTicketSale.address as `0x${string}`,
    abi: contracts[chainId].MonadTicketSale.abi,
  };
};

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reservationId = searchParams.get("reservationId");
  const { address: connectedAddress, isConnected } = useAccount();
  const { data: balanceData, isLoading: isBalanceLoading } = useBalance({
    address: connectedAddress,
  });

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [eventTitle, setEventTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [currentSeatIndex, setCurrentSeatIndex] = useState(0);
  const [failedSeats, setFailedSeats] = useState<Array<{ seatId: string; error: string }>>([]);
  const [successfulSeats, setSuccessfulSeats] = useState<string[]>([]);

  // Contract interaction
  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Gas fee estimation (mock - in real app, estimate from contract)
  const estimatedGasFee = 0.0001; // ~0.0001 ETH for minting NFTs
  const buffer = 0.0005; // Safety buffer

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
        setEventTitle(event.name);
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

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && reservation && currentSeatIndex < reservation.seats.length) {
      const currentSeat = reservation.seats[currentSeatIndex];
      setSuccessfulSeats(prev => [...prev, currentSeat.seatId]);

      // Move to next seat
      const nextIndex = currentSeatIndex + 1;
      if (nextIndex < reservation.seats.length) {
        setCurrentSeatIndex(nextIndex);
        // Trigger next mint
        mintNextSeat(nextIndex);
      } else {
        // All seats minted successfully
        setPaymentSuccess(true);
      }
    }
  }, [isConfirmed]);

  // Handle transaction error
  useEffect(() => {
    if (writeError && reservation && currentSeatIndex < reservation.seats.length) {
      const currentSeat = reservation.seats[currentSeatIndex];
      const errorMessage = (writeError as any)?.shortMessage || writeError.message || "Transaction failed";
      setFailedSeats(prev => [...prev, { seatId: currentSeat.seatId, error: errorMessage }]);

      // Move to next seat
      const nextIndex = currentSeatIndex + 1;
      if (nextIndex < reservation.seats.length) {
        setCurrentSeatIndex(nextIndex);
        // Trigger next mint
        mintNextSeat(nextIndex);
      } else {
        // All seats processed (some may have failed)
        if (successfulSeats.length > 0) {
          setPaymentSuccess(true);
        }
      }
    }
  }, [writeError]);

  const mintNextSeat = async (seatIndex: number) => {
    if (!reservation) return;

    const seat = reservation.seats[seatIndex];
    const { address, abi } = getContractConfig();

    try {
      await writeContract({
        address,
        abi,
        functionName: "buyTicket",
        args: [reservation.eventId, seat.seatId],
        value: seat.price,
      });
    } catch (error) {
      console.error("Minting error:", error);
    }
  };

  const handlePayment = async () => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    if (!reservation || reservation.seats.length === 0) {
      alert("No seats to mint");
      return;
    }

    // Reset state
    setFailedSeats([]);
    setSuccessfulSeats([]);
    setCurrentSeatIndex(0);

    // Start minting first seat
    mintNextSeat(0);
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Calculate payment feasibility
  const ticketPrice = reservation?.totalPrice || 0;
  const totalRequired = ticketPrice + estimatedGasFee + buffer;
  const currentBalance = balanceData ? parseFloat(formatEther(balanceData.value)) : 0;
  const hasEnoughBalance = currentBalance >= totalRequired;
  const balanceShortfall = totalRequired - currentBalance;

  // Payment status
  const getPaymentStatus = () => {
    if (!isConnected) {
      return { type: "warning", message: "Wallet not connected" };
    }
    if (isBalanceLoading) {
      return { type: "loading", message: "Checking balance..." };
    }
    if (!hasEnoughBalance) {
      return { type: "error", message: "Insufficient balance" };
    }
    return { type: "success", message: "Ready to mint" };
  };

  const paymentStatus = getPaymentStatus();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-[#6E54FF]"></span>
      </div>
    );
  }

  if (!reservation) {
    return null;
  }

  if (paymentSuccess) {
    const totalSuccessful = successfulSeats.length;
    const totalFailed = failedSeats.length;
    const hasFailures = totalFailed > 0;

    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6E54FF]/10 via-transparent to-[#85E6FF]/10"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#6E54FF]/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#85E6FF]/20 rounded-full blur-3xl animate-pulse"></div>

        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="max-w-2xl mx-auto">
            <div className="glass-card-strong monad-glow-strong">
              <div className="card-body text-center">
                {hasFailures ? (
                  <ExclamationTriangleIcon className="h-24 w-24 mx-auto text-[#FFAE45] animate-pulse" />
                ) : (
                  <CheckCircleIcon className="h-24 w-24 mx-auto monad-gradient-text animate-bounce" />
                )}
                <h2 className="text-3xl font-bold mt-4 monad-gradient-text font-mono">
                  {hasFailures ? "Partially Completed" : "Transaction Confirmed!"}
                </h2>
                <p className="text-base-content/70 font-mono">
                  {hasFailures
                    ? `${totalSuccessful} of ${totalSuccessful + totalFailed} tickets minted successfully`
                    : "Your NFT tickets have been minted"}
                </p>

                {hash && (
                  <div className="glass-card p-4 mt-4">
                    <p className="text-sm text-base-content/70 font-mono mb-2">Last Transaction Hash</p>
                    <p className="font-mono text-xs break-all monad-gradient-text font-bold">{hash}</p>
                  </div>
                )}

                <div className="glass-card p-4 mt-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <WalletIcon className="h-5 w-5 text-[#6E54FF]" />
                    <p className="text-sm text-base-content/70 font-mono">Minted to</p>
                  </div>
                  <Address address={connectedAddress} />
                </div>

                <div className="divider"></div>

                <div className="text-left space-y-3">
                  <h3 className="font-bold text-lg monad-gradient-text font-mono">Minting Results</h3>

                  {/* Successful Seats */}
                  {totalSuccessful > 0 && (
                    <div className="glass-card bg-[#34eeb6]/10 border border-[#34eeb6]/30 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckBadgeIcon className="h-5 w-5 text-[#34eeb6]" />
                        <p className="font-semibold font-mono text-sm text-[#34eeb6]">
                          Successfully Minted ({totalSuccessful})
                        </p>
                      </div>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {successfulSeats.map(seatId => {
                          const seat = reservation.seats.find(s => s.seatId === seatId);
                          return (
                            <div key={seatId} className="text-sm font-mono flex items-center gap-2">
                              <ShieldCheckIcon className="h-4 w-4 text-[#85E6FF]" />
                              Seat {seatId} - Token #{seat?.tokenId.toString()}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Failed Seats */}
                  {totalFailed > 0 && (
                    <div className="glass-card bg-[#FF8EE4]/10 border border-[#FF8EE4]/30 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <XCircleIcon className="h-5 w-5 text-[#FF8EE4]" />
                        <p className="font-semibold font-mono text-sm text-[#FF8EE4]">Failed to Mint ({totalFailed})</p>
                      </div>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {failedSeats.map(({ seatId, error }) => (
                          <div key={seatId} className="text-xs font-mono">
                            <p className="font-semibold text-[#FF8EE4]">Seat {seatId}</p>
                            <p className="text-base-content/70 mt-1">{error}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="glass-button p-3 rounded-lg">
                    <span className="font-semibold font-mono text-sm">Event:</span>
                    <span className="font-mono text-sm ml-2">{eventTitle}</span>
                  </div>
                </div>

                <div className="card-actions justify-center mt-6 gap-3">
                  <Link href="/my-tickets" className="btn monad-gradient text-white border-none btn-lg font-mono">
                    View My Tickets
                  </Link>
                  <Link href="/events" className="btn glass-button btn-lg font-mono">
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
          <div className="mb-8 glass-card-strong p-8 text-center monad-glow">
            <h1 className="text-5xl font-bold mb-4 monad-gradient-text font-mono">Complete Purchase</h1>
            <p className="text-lg text-base-content/70 font-mono mb-4">Mint your NFT tickets on Monad blockchain</p>
            <div className="flex items-center justify-center gap-3">
              <ClockIcon className="h-6 w-6 text-[#85E6FF]" />
              <div className="text-base-content/70 font-mono text-sm">Reservation expires in:</div>
              <div
                className={`font-mono text-3xl font-bold ${
                  timeRemaining < 60000 ? "text-[#FF8EE4] animate-pulse monad-glow" : "monad-gradient-text"
                }`}
              >
                {formatTime(timeRemaining)}
              </div>
            </div>
          </div>

          {/* Minting Progress */}
          {(isPending || isConfirming) && (
            <div className="glass-card-strong p-6 mb-6 border border-[#85E6FF]/50 monad-glow">
              <div className="flex items-center gap-4">
                <span className="loading loading-spinner loading-lg text-[#85E6FF]"></span>
                <div className="flex-1">
                  <p className="font-mono font-semibold text-lg monad-gradient-text">
                    {isPending ? "Waiting for wallet approval..." : "Minting NFT ticket..."}
                  </p>
                  <p className="font-mono text-sm text-base-content/70 mt-1">
                    Processing seat {currentSeatIndex + 1} of {reservation.seats.length}
                  </p>
                  <div className="w-full bg-base-300/30 rounded-full h-2 mt-3">
                    <div
                      className="bg-gradient-to-r from-[#6E54FF] to-[#85E6FF] h-2 rounded-full transition-all duration-500"
                      style={{ width: `${((currentSeatIndex + 1) / reservation.seats.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Wallet Info Card */}
            <div className="glass-card-strong monad-glow">
              <div className="card-body">
                <h2 className="card-title monad-gradient-text font-mono mb-4 flex items-center gap-2">
                  <WalletIcon className="h-6 w-6" />
                  Wallet Information
                </h2>

                {!isConnected ? (
                  <div className="text-center py-8">
                    <WalletIcon className="h-16 w-16 mx-auto text-base-content/30 mb-4" />
                    <p className="font-mono text-base-content/70 mb-4">Connect your wallet to continue</p>
                    <p className="font-mono text-xs text-base-content/50">You need to connect a wallet to mint NFT tickets</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Wallet Address */}
                    <div className="glass-card p-4">
                      <p className="text-xs font-mono text-base-content/70 mb-2">Connected Address</p>
                      <Address address={connectedAddress} />
                    </div>

                    {/* Network */}
                    <div className="glass-card p-4">
                      <p className="text-xs font-mono text-base-content/70 mb-2">Network</p>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#34eeb6] rounded-full animate-pulse"></div>
                        <span className="font-mono text-sm">Monad Testnet</span>
                      </div>
                    </div>

                    {/* Balance Check */}
                    <div
                      className={`glass-card p-4 border-2 ${
                        paymentStatus.type === "success"
                          ? "border-[#34eeb6]/50"
                          : paymentStatus.type === "error"
                            ? "border-[#FF8EE4]/50"
                            : "border-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-mono text-base-content/70">Wallet Balance</p>
                        {isBalanceLoading ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                          <div className="flex items-center gap-1">
                            {hasEnoughBalance ? (
                              <CheckBadgeIcon className="h-4 w-4 text-[#34eeb6]" />
                            ) : (
                              <ExclamationTriangleIcon className="h-4 w-4 text-[#FF8EE4]" />
                            )}
                            <span
                              className={`font-mono text-sm font-bold ${hasEnoughBalance ? "text-[#34eeb6]" : "text-[#FF8EE4]"}`}
                            >
                              {currentBalance.toFixed(4)} ETH
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="h-2 bg-base-300/30 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            hasEnoughBalance ? "bg-gradient-to-r from-[#34eeb6] to-[#85E6FF]" : "bg-[#FF8EE4]"
                          }`}
                          style={{
                            width: `${Math.min((currentBalance / totalRequired) * 100, 100)}%`,
                          }}
                        ></div>
                      </div>
                      {!hasEnoughBalance && !isBalanceLoading && (
                        <p className="text-xs font-mono text-[#FF8EE4] mt-2">
                          Need {balanceShortfall.toFixed(4)} ETH more
                        </p>
                      )}
                    </div>

                    {/* Transaction Breakdown */}
                    <div className="glass-card-strong p-4">
                      <p className="text-xs font-mono text-base-content/70 mb-3 font-semibold">Transaction Breakdown</p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-mono text-base-content/60">Ticket Price</span>
                          <span className="text-sm font-mono font-semibold">{ticketPrice.toFixed(4)} ETH</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1">
                            <BoltIcon className="h-3 w-3 text-[#FFAE45]" />
                            <span className="text-xs font-mono text-base-content/60">Estimated Gas</span>
                          </div>
                          <span className="text-sm font-mono font-semibold">{estimatedGasFee.toFixed(4)} ETH</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1">
                            <ShieldCheckIcon className="h-3 w-3 text-[#85E6FF]" />
                            <span className="text-xs font-mono text-base-content/60">Safety Buffer</span>
                          </div>
                          <span className="text-sm font-mono font-semibold">{buffer.toFixed(4)} ETH</span>
                        </div>
                        <div className="divider my-2"></div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-mono font-bold">Total Required</span>
                          <span className="text-lg font-mono font-bold monad-gradient-text">
                            {totalRequired.toFixed(4)} ETH
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Status Card */}
                    {paymentStatus.type === "success" ? (
                      <div className="glass-card bg-[#34eeb6]/10 border border-[#34eeb6]/30 p-4">
                        <div className="flex items-center gap-2">
                          <CheckBadgeIcon className="h-5 w-5 text-[#34eeb6]" />
                          <div>
                            <p className="text-xs font-mono font-semibold text-[#34eeb6]">Ready to Mint</p>
                            <p className="text-xs font-mono text-base-content/60 mt-1">
                              You have sufficient balance to complete this transaction
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : paymentStatus.type === "error" ? (
                      <div className="glass-card bg-[#FF8EE4]/10 border border-[#FF8EE4]/30 p-4">
                        <div className="flex items-center gap-2">
                          <ExclamationTriangleIcon className="h-5 w-5 text-[#FF8EE4]" />
                          <div>
                            <p className="text-xs font-mono font-semibold text-[#FF8EE4]">Insufficient Balance</p>
                            <p className="text-xs font-mono text-base-content/60 mt-1">
                              Please add {balanceShortfall.toFixed(4)} ETH to your wallet to continue
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Security Info */}
                    <div className="glass-button p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldCheckIcon className="h-5 w-5 text-[#85E6FF]" />
                        <p className="text-xs font-mono font-semibold">Secure NFT Minting</p>
                      </div>
                      <p className="text-xs font-mono text-base-content/60">
                        Tickets will be minted as ERC-721 NFTs on Monad blockchain and transferred to your wallet. View
                        them in any NFT marketplace.
                      </p>
                    </div>

                    {/* Mint Button */}
                    <button
                      onClick={handlePayment}
                      disabled={isPending || isConfirming || !hasEnoughBalance || isBalanceLoading}
                      className={`btn w-full btn-lg font-mono transition-all ${
                        hasEnoughBalance && !isPending && !isConfirming
                          ? "monad-gradient text-white border-none hover:monad-glow-strong"
                          : "btn-disabled opacity-50"
                      }`}
                    >
                      {isPending || isConfirming ? (
                        <>
                          <span className="loading loading-spinner"></span>
                          {isPending ? "Approve in Wallet..." : "Minting NFTs..."}
                        </>
                      ) : isBalanceLoading ? (
                        <>
                          <span className="loading loading-spinner"></span>
                          Checking Balance...
                        </>
                      ) : !hasEnoughBalance ? (
                        <>
                          <ExclamationTriangleIcon className="h-5 w-5" />
                          Insufficient Funds
                        </>
                      ) : (
                        <>
                          <ShieldCheckIcon className="h-5 w-5" />
                          Mint {reservation.seats.length} NFT Ticket{reservation.seats.length > 1 ? "s" : ""}
                        </>
                      )}
                    </button>

                    {!hasEnoughBalance && !isBalanceLoading && (
                      <div className="text-center">
                        <p className="text-xs font-mono text-base-content/50">
                          Add funds to your wallet to complete this transaction
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary Card */}
            <div className="glass-card-strong sticky top-4 monad-glow">
              <div className="card-body">
                <h2 className="card-title monad-gradient-text font-mono">Order Summary</h2>

                <div className="space-y-3 mt-4">
                  <div className="glass-button p-4 rounded-lg">
                    <p className="font-semibold font-mono text-sm monad-gradient-text mb-2">{eventTitle}</p>
                    <p className="text-xs font-mono text-base-content/60">Event Name</p>
                  </div>

                  <div className="divider my-2"></div>

                  <div>
                    <p className="text-xs font-mono text-base-content/70 mb-2">Selected NFT Tickets</p>
                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {reservation.seats.map(seat => (
                        <div key={seat.seatId} className="flex justify-between text-sm glass-button p-3 rounded">
                          <div>
                            <p className="font-mono font-semibold">{seat.seatId}</p>
                            <p className="font-mono text-xs text-base-content/60">Token #{seat.tokenId.toString()}</p>
                          </div>
                          <span className="font-semibold font-mono">{parseFloat(formatEther(seat.price)).toFixed(4)} ETH</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="divider my-2"></div>

                  <div className="flex justify-between items-center glass-button p-3 rounded">
                    <span className="font-semibold font-mono">Total NFTs:</span>
                    <span className="text-lg font-mono monad-gradient-text font-bold">{reservation.seats.length}</span>
                  </div>

                  <div className="glass-card-strong p-4 monad-glow">
                    <div className="flex justify-between items-center text-xl font-bold">
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
