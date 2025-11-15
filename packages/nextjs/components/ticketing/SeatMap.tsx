"use client";

import { Seat } from "../../types/ticket";
import { useState } from "react";

interface SeatMapProps {
  seats: Seat[];
  selectedSeats: string[];
  onSeatSelect: (seatId: string) => void;
}

export const SeatMap = ({ seats, selectedSeats, onSeatSelect }: SeatMapProps) => {
  const [selectedSection, setSelectedSection] = useState<string>("All");

  const sections = Array.from(new Set(seats.map(seat => seat.section)));
  const filteredSeats = selectedSection === "All" ? seats : seats.filter(seat => seat.section === selectedSection);

  const seatsBySection = filteredSeats.reduce(
    (acc, seat) => {
      if (!acc[seat.section]) {
        acc[seat.section] = [];
      }
      acc[seat.section].push(seat);
      return acc;
    },
    {} as Record<string, Seat[]>,
  );

  const getSeatColor = (seat: Seat) => {
    if (selectedSeats.includes(seat.id)) {
      return "monad-gradient text-white hover:monad-glow";
    }
    if (seat.status === "sold") {
      return "bg-base-300/50 cursor-not-allowed opacity-30";
    }
    if (seat.status === "reserved") {
      return "bg-[#FFAE45]/50 cursor-not-allowed opacity-50";
    }
    return "glass-button hover:bg-[#6E54FF]/30 hover:border-[#6E54FF]";
  };

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === "available") {
      onSeatSelect(seat.id);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedSection("All")}
            className={`btn btn-sm font-mono ${
              selectedSection === "All" ? "monad-gradient text-white border-none" : "glass-button"
            }`}
          >
            All Sections
          </button>
          {sections.map(section => (
            <button
              key={section}
              onClick={() => setSelectedSection(section)}
              className={`btn btn-sm font-mono ${
                selectedSection === section ? "monad-gradient text-white border-none" : "glass-button"
              }`}
            >
              Section {section}
            </button>
          ))}
        </div>

        <div className="flex gap-4 text-sm flex-wrap glass-card p-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 glass-button rounded"></div>
            <span className="font-mono text-xs">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 monad-gradient rounded"></div>
            <span className="font-mono text-xs">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#FFAE45]/50 rounded"></div>
            <span className="font-mono text-xs">Reserved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-base-300/50 rounded"></div>
            <span className="font-mono text-xs">Sold</span>
          </div>
        </div>
      </div>

      <div className="glass-card-strong p-6 text-center mb-6 monad-glow">
        <div className="text-xl font-bold font-mono monad-gradient-text">STAGE</div>
      </div>

      <div className="space-y-8">
        {Object.entries(seatsBySection).map(([section, sectionSeats]) => {
          const rowsMap = sectionSeats.reduce(
            (acc, seat) => {
              if (!acc[seat.row]) {
                acc[seat.row] = [];
              }
              acc[seat.row].push(seat);
              return acc;
            },
            {} as Record<number, Seat[]>,
          );

          return (
            <div key={section} className="glass-card p-6">
              <h3 className="text-xl font-bold mb-4 text-center monad-gradient-text font-mono">
                Section {section}
              </h3>
              <div className="space-y-2">
                {Object.entries(rowsMap)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([row, rowSeats]) => (
                    <div key={row} className="flex items-center gap-2">
                      <div className="w-12 text-sm font-semibold text-right font-mono">Row {row}</div>
                      <div className="flex gap-1 flex-wrap">
                        {rowSeats
                          .sort((a, b) => a.number - b.number)
                          .map(seat => (
                            <button
                              key={seat.id}
                              onClick={() => handleSeatClick(seat)}
                              disabled={seat.status !== "available"}
                              className={`w-8 h-8 rounded text-xs font-bold font-mono transition-all ${getSeatColor(seat)}`}
                              title={`Section ${seat.section}, Row ${seat.row}, Seat ${seat.number} - ${seat.price} ETH`}
                            >
                              {seat.number}
                            </button>
                          ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
