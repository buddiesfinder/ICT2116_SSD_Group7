'use client';

import { useEffect, useState, useRef } from 'react';

interface Event {
  event_id: number;
  title: string;
  picture: string;
  description: string;
  location: string;
  created_at: string;
  lowest_price: number;
}

export default function HomeEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Event[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const filteredEvents = searchQuery.trim() !== '' ? suggestions : events;


  useEffect(() => {
    const fetchEvents = async () => {
      const res = await fetch('/api/events');
      const data = await res.json();
      if (data.success) setEvents(data.events);
    };

    fetchEvents();
  }, []);

  useEffect(() => {
  if (debounceRef.current) clearTimeout(debounceRef.current);

  if (searchQuery.trim() === '') {
    setSuggestions([]);
    setShowSuggestions(false);
    return;
  }

  debounceRef.current = setTimeout(async () => {
    const res = await fetch(`/api/events/search?query=${encodeURIComponent(searchQuery)}`);
    const data = await res.json();
    if (data.success) {
      setSuggestions(data.events);
      setShowSuggestions(true);
    }
  }, 300);
}, [searchQuery]);

  return (
    <section className="p-6 text-white">
      
      {/* Search Bar */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 bg-zinc-800 border border-zinc-600 rounded"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-10 w-full bg-zinc-900 border border-zinc-700 rounded mt-1 max-h-60 overflow-y-auto">
            {suggestions.map((event) => (
              <li
                key={event.event_id}
                onClick={() => {
                  setSearchQuery(event.title); // update input field
                  setShowSuggestions(false);   // close the dropdown
                }}
                className="p-2 hover:bg-zinc-700 cursor-pointer"
              >
                {event.title} — <span className="text-zinc-400">{event.location}</span>
              </li>
            ))}
          </ul>
        )}
      </div>


      <h2 className="text-2xl font-bold mb-4">All Events</h2>

      {/* Event Cards */}
      {filteredEvents.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {filteredEvents.map((event) => (
            <div key={event.event_id} className="bg-zinc-900 rounded shadow p-4">
              <img
                src={event.picture}
                alt={event.title}
                className="rounded mb-4 w-full max-h-96 object-contain"
              />
              <h3 className="text-xl font-semibold">{event.title}</h3>
              <p className="text-sm text-zinc-400">{event.location}</p>
              <p className="mt-2">{event.description}</p>
              <p className="mt-2 text-blue-300">From ${event.lowest_price}</p>
              <div className="mt-4">
                <a
                  href={`/event/${event.event_id}`}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                >
                  View Details
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-zinc-400">No events match your search.</p>
      )}
    </section>
  );
}


