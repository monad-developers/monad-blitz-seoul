"use client";

import { useEffect, useState } from "react";
import { EventCard } from "../../components/ticketing/EventCard";
import { EventRepository } from "../../repositories/EventRepository";
import { EventUI } from "../../types/ticket";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

const CATEGORIES = ["All", "Conference", "Concert", "Festival"];

export default function EventsPage() {
  const [events, setEvents] = useState<EventUI[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [selectedCategory, searchQuery, events]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await EventRepository.getAllEvents();
      setEvents(data);
      setFilteredEvents(data);
    } catch (error) {
      console.error("Failed to load events:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = events;

    if (selectedCategory !== "All") {
      filtered = filtered.filter(event => event.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        event =>
          event.name.toLowerCase().includes(query) ||
          event.description.toLowerCase().includes(query) ||
          event.location.toLowerCase().includes(query),
      );
    }

    setFilteredEvents(filtered);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#6E54FF]/5 via-transparent to-[#85E6FF]/5"></div>
      <div className="absolute top-20 left-10 w-96 h-96 bg-[#6E54FF]/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#85E6FF]/10 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="mb-12 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="monad-gradient-text">Discover Events</span>
          </h1>
          <p className="text-lg text-base-content/70 font-mono">Find and book tickets for amazing events</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8 max-w-4xl mx-auto">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#6E54FF]" />
            <input
              type="text"
              placeholder="Search events..."
              className="glass-card w-full pl-12 pr-4 py-3 font-mono text-sm focus:monad-glow transition-all outline-none"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
        </div>

        <div className="flex gap-2 mb-10 overflow-x-auto pb-2 justify-center flex-wrap">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`btn btn-sm font-mono transition-all ${
                selectedCategory === category ? "monad-gradient text-white border-none monad-glow" : "glass-button"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="relative">
              <span className="loading loading-spinner loading-lg text-[#6E54FF]"></span>
              <div className="absolute inset-0 loading loading-spinner loading-lg text-[#85E6FF] opacity-50"></div>
            </div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16 glass-card max-w-md mx-auto">
            <p className="text-xl text-base-content/70 font-mono">No events found</p>
            <p className="text-sm text-base-content/50 mt-2">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {filteredEvents.map(event => (
              <EventCard key={event.eventId.toString()} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
