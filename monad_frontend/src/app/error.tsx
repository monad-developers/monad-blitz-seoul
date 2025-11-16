"use client";

import { useEffect } from "react";

interface ErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

const ErrorBoundary = ({ error, reset }: ErrorProps) => {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <h2 className="text-2xl font-semibold">Console crashed</h2>
        <p className="mt-3 text-sm text-slate-300">{error.message}</p>
        <button type="button" className="mt-6 rounded-xl bg-cyan-400/90 px-4 py-2 text-sm font-semibold text-black" onClick={reset}>
          Reload console
        </button>
      </div>
    </div>
  );
};

export default ErrorBoundary;
