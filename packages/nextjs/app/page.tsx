"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import {
  BoltIcon,
  CheckBadgeIcon,
  ClockIcon,
  RectangleStackIcon,
  ShieldCheckIcon,
  TicketIcon,
} from "@heroicons/react/24/outline";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({});
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 },
    );

    const elements = document.querySelectorAll("[data-animate]");
    elements.forEach(el => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <>
      <div className="min-h-screen relative overflow-hidden">
        {/* Background gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#6E54FF]/10 via-transparent to-[#85E6FF]/10"></div>
        <div className="absolute top-20 left-20 w-[500px] h-[500px] bg-[#6E54FF]/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-[500px] h-[500px] bg-[#85E6FF]/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF8EE4]/10 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          {/* Hero Section */}
          <div
            id="hero"
            data-animate
            className={`flex items-center flex-col pt-20 pb-16 px-5 transition-all duration-1000 ${
              isVisible.hero ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <div className="max-w-5xl mx-auto text-center">
              <h1 className="text-7xl md:text-8xl font-bold monad-gradient-text font-mono mb-8 animate-fade-in">
                Ticketing
                <br />
                with Monad
              </h1>
              <p className="text-3xl md:text-4xl font-bold text-base-content mb-6 animate-fade-in-delay-1">
                Fair Queuing Ticketing System
              </p>
              <p className="text-xl text-base-content/70 font-mono max-w-3xl mx-auto mb-12 leading-relaxed animate-fade-in-delay-2">
                Leverage Monad&apos;s high-throughput blockchain to eliminate unfair ticketing practices. No more
                browser crashes, no more lost opportunities.
              </p>

              <div className="flex gap-4 justify-center flex-wrap animate-fade-in-delay-3">
                <Link
                  href="/events"
                  className="btn btn-lg monad-gradient text-white border-none font-mono hover:monad-glow-strong hover:scale-105 transition-transform"
                >
                  <TicketIcon className="h-5 w-5" />
                  Browse Events
                </Link>
                {connectedAddress && (
                  <Link
                    href="/my-tickets"
                    className="btn btn-lg glass-button font-mono hover:bg-[#6E54FF]/30 hover:scale-105 transition-transform"
                  >
                    <RectangleStackIcon className="h-5 w-5" />
                    My Tickets
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Problem Statement */}
          <div
            id="problem"
            data-animate
            className={`py-20 px-5 transition-all duration-1000 ${
              isVisible.problem ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <div className="max-w-6xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 monad-gradient-text font-mono">
                The Problem
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="glass-card-strong p-8 monad-glow hover:scale-105 transition-transform duration-300">
                  <div className="flex items-start gap-4">
                    <ClockIcon className="h-10 w-10 text-[#FF8EE4] flex-shrink-0" />
                    <div>
                      <h3 className="text-2xl font-bold mb-3 font-mono">Endless Waiting</h3>
                      <p className="text-base-content/80 font-mono">
                        Users must arrive early and maintain constant browser presence during ticket sales, wasting
                        valuable time.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="glass-card-strong p-8 monad-glow hover:scale-105 transition-transform duration-300">
                  <div className="flex items-start gap-4">
                    <ShieldCheckIcon className="h-10 w-10 text-[#FF8EE4] flex-shrink-0" />
                    <div>
                      <h3 className="text-2xl font-bold mb-3 font-mono">Technical Failures</h3>
                      <p className="text-base-content/80 font-mono">
                        Browser crashes or connection issues result in lost opportunity, despite being first in line.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Solution */}
          <div
            id="solution"
            data-animate
            className={`py-20 px-5 bg-base-content/5 transition-all duration-1000 ${
              isVisible.solution ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <div className="max-w-6xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 monad-gradient-text font-mono">
                Our Solution
              </h2>
              <p className="text-xl text-center text-base-content/70 font-mono mb-16 max-w-3xl mx-auto">
                A blockchain-powered fair queuing system that guarantees transaction order and eliminates traditional
                ticketing pain points
              </p>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="glass-card p-6 text-center hover:monad-glow hover:scale-105 transition-all duration-300">
                  <BoltIcon className="h-12 w-12 text-[#6E54FF] mx-auto mb-4 group-hover:animate-bounce" />
                  <h3 className="text-xl font-bold mb-3 font-mono monad-gradient-text">High-TPS Blockchain</h3>
                  <p className="text-sm text-base-content/80 font-mono">
                    Leverage Monad&apos;s exceptional transaction throughput for seamless ticket processing
                  </p>
                </div>

                <div className="glass-card p-6 text-center hover:monad-glow hover:scale-105 transition-all duration-300">
                  <CheckBadgeIcon className="h-12 w-12 text-[#85E6FF] mx-auto mb-4 group-hover:animate-bounce" />
                  <h3 className="text-xl font-bold mb-3 font-mono monad-gradient-text">Transaction Order Preserved</h3>
                  <p className="text-sm text-base-content/80 font-mono">
                    Sequential commitment ensures fairness despite optimistic async execution
                  </p>
                </div>

                <div className="glass-card p-6 text-center hover:monad-glow hover:scale-105 transition-all duration-300">
                  <ShieldCheckIcon className="h-12 w-12 text-[#FFAE45] mx-auto mb-4 group-hover:animate-bounce" />
                  <h3 className="text-xl font-bold mb-3 font-mono monad-gradient-text">MEV Protection</h3>
                  <p className="text-sm text-base-content/80 font-mono">
                    Contract-level indexing and commit-reveal schemes prevent transaction manipulation
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div
            id="howitworks"
            data-animate
            className={`py-20 px-5 transition-all duration-1000 ${
              isVisible.howitworks ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <div className="max-w-6xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 monad-gradient-text font-mono">
                How It Works
              </h2>

              <div className="space-y-8">
                <div className="glass-card-strong p-8 flex gap-6 items-start hover:monad-glow hover:translate-x-4 transition-all duration-300">
                  <div className="text-5xl font-bold monad-gradient-text font-mono flex-shrink-0">1</div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3 font-mono">Event Registration</h3>
                    <p className="text-base-content/80 font-mono">
                      Event issuers register events with seat tiers and pricing on the blockchain
                    </p>
                  </div>
                </div>

                <div className="glass-card-strong p-8 flex gap-6 items-start hover:monad-glow hover:translate-x-4 transition-all duration-300">
                  <div className="text-5xl font-bold monad-gradient-text font-mono flex-shrink-0">2</div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3 font-mono">Fair Queue System</h3>
                    <p className="text-base-content/80 font-mono">
                      Users submit purchase requests with transaction order preserved in the mempool, ensuring
                      first-come first-served fairness
                    </p>
                  </div>
                </div>

                <div className="glass-card-strong p-8 flex gap-6 items-start hover:monad-glow hover:translate-x-4 transition-all duration-300">
                  <div className="text-5xl font-bold monad-gradient-text font-mono flex-shrink-0">3</div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3 font-mono">NFT Ticket Minting</h3>
                    <p className="text-base-content/80 font-mono">
                      Successful purchases mint ERC-721 NFT tickets directly to your wallet with cryptographic proof of
                      ownership
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Future Improvements */}
          <div
            id="future"
            data-animate
            className={`py-20 px-5 bg-base-content/5 transition-all duration-1000 ${
              isVisible.future ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <div className="max-w-6xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 monad-gradient-text font-mono">
                Future Enhancements
              </h2>
              <p className="text-lg text-center text-base-content/70 font-mono mb-12 max-w-3xl mx-auto">
                We&apos;re continuously improving TMON to provide the best ticketing experience
              </p>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="glass-card p-6 hover:monad-glow hover:scale-105 transition-all duration-300">
                  <h3 className="text-lg font-bold mb-3 font-mono monad-gradient-text">Web2 Integration</h3>
                  <p className="text-sm text-base-content/80 font-mono">
                    Seamless wallet-based traffic control with traditional ticketing platforms
                  </p>
                </div>

                <div className="glass-card p-6 hover:monad-glow hover:scale-105 transition-all duration-300">
                  <h3 className="text-lg font-bold mb-3 font-mono monad-gradient-text">Commit-Reveal Scheme</h3>
                  <p className="text-sm text-base-content/80 font-mono">
                    Enhanced MEV protection through hash submission and verification phases
                  </p>
                </div>

                <div className="glass-card p-6 hover:monad-glow hover:scale-105 transition-all duration-300">
                  <h3 className="text-lg font-bold mb-3 font-mono monad-gradient-text">Deposit Mechanism</h3>
                  <p className="text-sm text-base-content/80 font-mono">
                    Refundable deposits with reveal-stage validation for additional security
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div
            id="cta"
            data-animate
            className={`py-20 px-5 transition-all duration-1000 ${
              isVisible.cta ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
          >
            <div className="max-w-4xl mx-auto text-center">
              <div className="glass-card-strong p-12 monad-glow-strong hover:monad-glow transition-all">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 monad-gradient-text font-mono">
                  Ready to Experience Fair Ticketing?
                </h2>
                <p className="text-xl text-base-content/70 font-mono mb-8">
                  Join the revolution in blockchain-powered event ticketing
                </p>
                <Link
                  href="/events"
                  className="btn btn-lg monad-gradient text-white border-none font-mono hover:monad-glow-strong hover:scale-110 transition-transform"
                >
                  <TicketIcon className="h-6 w-6" />
                  Get Your Tickets Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
