"use client";

import { Event } from "../../types/ticket";
import Link from "next/link";
import { CalendarIcon, MapPinIcon, TicketIcon } from "@heroicons/react/24/outline";

interface EventCardProps {
  event: Event;
}

export const EventCard = ({ event }: EventCardProps) => {
  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const availabilityPercentage = Math.round((event.availableSeats / event.totalSeats) * 100);

  return (
    <div className="glass-card hover:monad-glow transition-all duration-300 overflow-hidden group">
      <figure className="relative h-48 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6E54FF]/20 to-[#85E6FF]/20 z-10"></div>
        <img
          src={event.imageUrl}
          alt={event.title}
          className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3 z-20">
          <span className="glass-button px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase tracking-wider">
            {event.category}
          </span>
        </div>
      </figure>
      <div className="card-body">
        <h2 className="card-title text-lg font-bold monad-gradient-text">{event.title}</h2>
        <p className="text-sm text-base-content/80 line-clamp-2">{event.description}</p>

        <div className="flex flex-col gap-2 mt-3">
          <div className="flex items-center gap-2 text-sm glass-button px-3 py-2 rounded-lg">
            <CalendarIcon className="h-4 w-4 text-[#6E54FF]" />
            <span className="font-mono text-xs">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2 text-sm glass-button px-3 py-2 rounded-lg">
            <MapPinIcon className="h-4 w-4 text-[#85E6FF]" />
            <span className="font-mono text-xs">{event.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm glass-button px-3 py-2 rounded-lg">
            <TicketIcon className="h-4 w-4 text-[#FF8EE4]" />
            <span className="font-mono text-xs">
              {event.availableSeats} / {event.totalSeats} seats
            </span>
          </div>
        </div>

        <div className="mt-3">
          <div className="h-2 bg-base-300/30 rounded-full overflow-hidden backdrop-blur-sm">
            <div
              className="h-full monad-gradient transition-all duration-500"
              style={{ width: `${availabilityPercentage}%` }}
            ></div>
          </div>
          <p className="text-xs text-center mt-2 font-mono">{availabilityPercentage}% available</p>
        </div>

        <div className="card-actions justify-between items-center mt-4">
          <div className="text-2xl font-bold monad-gradient-text font-mono">{event.price} ETH</div>
          <Link
            href={`/seats/${event.id}`}
            className="btn monad-gradient text-white border-none hover:monad-glow font-mono"
          >
            Select Seats
          </Link>
        </div>
      </div>
    </div>
  );
};
