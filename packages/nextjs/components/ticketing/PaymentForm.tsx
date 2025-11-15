"use client";

import { useState } from "react";
import { PaymentRequest } from "../../types/ticket";
import { CreditCardIcon, WalletIcon } from "@heroicons/react/24/outline";

interface PaymentFormProps {
  totalAmount: number;
  onSubmit: (request: PaymentRequest) => Promise<void>;
  reservationId: string;
}

export const PaymentForm = ({ totalAmount, onSubmit, reservationId }: PaymentFormProps) => {
  const [paymentMethod, setPaymentMethod] = useState<"credit_card" | "wallet">("wallet");
  const [processing, setProcessing] = useState(false);

  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentMethod === "credit_card") {
      if (!cardNumber || !cardName || !expiryDate || !cvv) {
        alert("Please fill in all card details");
        return;
      }
    }

    try {
      setProcessing(true);
      await onSubmit({
        reservationId,
        paymentMethod,
        amount: totalAmount,
      });
    } catch (error) {
      console.error("Payment failed:", error);
    } finally {
      setProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "");
    const groups = cleaned.match(/.{1,4}/g) || [];
    return groups.join(" ").substring(0, 19);
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    }
    return cleaned;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="label">
          <span className="label-text font-semibold font-mono">Payment Method</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setPaymentMethod("wallet")}
            className={`btn font-mono gap-2 ${
              paymentMethod === "wallet" ? "monad-gradient text-white border-none" : "glass-button"
            }`}
          >
            <WalletIcon className="h-5 w-5" />
            Crypto Wallet
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod("credit_card")}
            className={`btn font-mono gap-2 ${
              paymentMethod === "credit_card" ? "monad-gradient text-white border-none" : "glass-button"
            }`}
          >
            <CreditCardIcon className="h-5 w-5" />
            Credit Card
          </button>
        </div>
      </div>

      {paymentMethod === "wallet" ? (
        <div className="glass-card p-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-current shrink-0 w-8 h-8 text-[#85E6FF] mx-auto mb-3"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <div className="text-center">
            <h3 className="font-bold font-mono monad-gradient-text mb-2">Wallet Payment</h3>
            <div className="text-xs font-mono text-base-content/70">
              You will be prompted to confirm the transaction in your wallet.
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-mono">Card Number</span>
            </label>
            <input
              type="text"
              placeholder="1234 5678 9012 3456"
              className="glass-card px-4 py-3 font-mono text-sm outline-none focus:monad-glow transition-all"
              value={cardNumber}
              onChange={e => setCardNumber(formatCardNumber(e.target.value))}
              maxLength={19}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-mono">Cardholder Name</span>
            </label>
            <input
              type="text"
              placeholder="John Doe"
              className="glass-card px-4 py-3 font-mono text-sm outline-none focus:monad-glow transition-all"
              value={cardName}
              onChange={e => setCardName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-mono">Expiry Date</span>
              </label>
              <input
                type="text"
                placeholder="MM/YY"
                className="glass-card px-4 py-3 font-mono text-sm outline-none focus:monad-glow transition-all"
                value={expiryDate}
                onChange={e => setExpiryDate(formatExpiryDate(e.target.value))}
                maxLength={5}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-mono">CVV</span>
              </label>
              <input
                type="text"
                placeholder="123"
                className="glass-card px-4 py-3 font-mono text-sm outline-none focus:monad-glow transition-all"
                value={cvv}
                onChange={e => setCvv(e.target.value.replace(/\D/g, "").substring(0, 4))}
                maxLength={4}
              />
            </div>
          </div>
        </div>
      )}

      <div className="divider"></div>

      <div className="glass-card-strong p-6 monad-glow">
        <div className="flex justify-between items-center text-xl font-bold">
          <span className="font-mono">Total Amount:</span>
          <span className="monad-gradient-text font-mono">{totalAmount.toFixed(4)} MON</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={processing}
        className="btn monad-gradient text-white border-none w-full btn-lg font-mono hover:monad-glow-strong"
      >
        {processing ? (
          <>
            <span className="loading loading-spinner"></span>
            Processing Payment...
          </>
        ) : (
          `Pay ${totalAmount.toFixed(4)} MON`
        )}
      </button>
    </form>
  );
};
