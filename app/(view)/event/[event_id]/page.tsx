//displays a detailed view of a single event, including its dates and times

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Event {
  event_id: number;
  title: string;
  picture: string;
  description: string;
  location: string;
  created_at: string;
  lowest_price: number;
}

interface EventDate {
  event_date: string;
  start_time: string;
  end_time: string;
}

export default function EventDetailPage() {
  const { event_id } = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [seatCategories, setSeatCategories] = useState<{ name: string; price: number }[]>([]);
  const [dates, setDates] = useState<EventDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketSelections, setTicketSelections] = useState<Record<string, number>>({});


  const seatConfig = {
  Premium: { rows: 2, cols: 25 },
  Standard: { rows: 4, cols: 25 },
  Economy: { rows: 6, cols: 25 }
  };

  const getSeatCount = (category: keyof typeof seatConfig) =>
    seatConfig[category].rows * seatConfig[category].cols;

  useEffect(() => {
    const fetchEventDetail = async () => {
      try {
        const res = await fetch(`/api/events/${event_id}`);
        const data = await res.json();
        if (data.success) {
          setEvent(data.event);
          setDates(data.dates);
          setSeatCategories(data.seatCategories || []);
        }
      } catch (error) {
        console.error('Failed to fetch event details', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetail();
  }, [event_id]);

  if (loading) return <div className="text-white p-6">Loading...</div>;
  if (!event) return <div className="text-white p-6">Event not found</div>;

  const renderSeatGrid = (
  rows: number,
  cols: number,
  section: string,
  color: string
) => {
  const seats = [];

  for (let r = 0; r < rows; r++) {
    const row = [];
    const rowLetter = String.fromCharCode(65 + r); // A, B, C...

    for (let c = 0; c < cols; c++) {
      const seatLabel = `${rowLetter}${c + 1}`;
      row.push(
        <div
          key={seatLabel}
          className={`w-5 h-5 m-0.5 rounded ${color} text-[10px] flex items-center justify-center`}
        >
        </div>
      );
    }

    seats.push(
      <div key={`row-${r}`} className="flex justify-center">
        {row}
      </div>
    );
  }

  return seats;
};

  return (
    <div className="p-6 text-white">
      <img
        src={event.picture}
        alt={event.title}
        className="rounded mb-4 w-full max-h-96 object-contain"
      />
      <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
      <p className="text-zinc-400">{event.location}</p>
      <p className="mt-2">{event.description}</p>

      <h3 className="text-lg font-semibold mt-6">Seat Category Prices</h3>
      {seatCategories.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {seatCategories.map((cat, idx) => (
            <li key={idx}>
              <span className="font-medium">{cat.name}:</span> ${cat.price}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-zinc-400">No seat categories found.</p>
      )}

      <h2 className="text-xl font-bold mt-6">Available Dates & Times</h2>
      {dates.length === 0 ? (
        <p className="text-zinc-400 mt-2">No event dates available.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {dates.map((d, i) => (
            <li
              key={i}
              className="bg-zinc-800 p-3 rounded border border-zinc-600"
            >
              <span className="font-semibold">{d.event_date.split('T')[0]}</span> |{' '}
              {d.start_time.slice(0, 5)} - {d.end_time.slice(0, 5)}
            </li>
          ))}
        </ul>
      )}

      <h2 className="text-xl font-bold mt-6">Seat Selection</h2>
      <div className="mt-4 flex flex-col lg:flex-row gap-6">
      {/* Left: Seat Map */}
      <div className="flex-1 bg-white rounded p-4 text-black shadow-md">
      <h3 className="font-bold text-lg mb-3 text-black-600">Seat Map</h3>
      <div className="bg-gray-800 text-white text-center py-2 rounded-t">STAGE</div>

      {/* Premium */}
      <div className="mt-4">
        <div className="text-center font-semibold text-red-500 mb-1">
          Premium ({getSeatCount("Premium")} seats)
        </div>
        {renderSeatGrid(2, 25, "Premium", "bg-red-400")}
      </div>

      {/* Standard */}
      <div className="mt-4">
        <div className="text-center font-semibold text-blue-500 mb-1">
          Standard ({getSeatCount("Standard")} seats)
        </div>
        {renderSeatGrid(4, 25, "Standard", "bg-blue-200")}
      </div>

      {/* Economy */}
      <div className="mt-4">
        <div className="text-center font-semibold text-green-500 mb-1">
          Economy ({getSeatCount("Economy")} seats)
        </div>
        {renderSeatGrid(6, 25, "Economy", "bg-green-200")}
      </div>

      {/* Exits */}
      <div className="mt-4 flex justify-between text-xs text-black-500">
        <span>EXIT</span>
        <span>EXIT</span>
      </div>

      {/* Legend */}
      <div className="mt-4 text-sm flex gap-4 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-400 rounded-sm" /> Premium
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-200 rounded-sm" /> Standard
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-200 rounded-sm" /> Economy
        </div>
      </div>
    </div>

      {/* Right: Seat Selection Panel */}
      <div className="w-full lg:w-80 bg-white rounded p-6 text-black shadow-md">
        <h4 className="font-semibold text-lg text-gray-700 mb-4">Choose Your Tickets (Max 2)</h4>
        {seatCategories.map((cat, i) => {
          const selectedCount = ticketSelections[cat.name] || 0;
          const totalSelected = Object.values(ticketSelections).reduce((sum, val) => sum + val, 0);
          const options = [0, 1, 2].filter(n => n + totalSelected - selectedCount <= 2); // adjust dropdown to prevent over-selection

          return (
            <div key={i} className="mb-4">
              <label className="block text-sm font-medium mb-1">
                {cat.name} - ${cat.price}
              </label>
              <select
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={selectedCount}
                onChange={(e) => {
                  const newVal = Number(e.target.value);
                  setTicketSelections(prev => ({
                    ...prev,
                    [cat.name]: newVal
                  }));
                }}
              >
                {options.map(n => (
                  <option key={n} value={n}>{n} ticket{n == 2 ? 's' : ''}</option>
                ))}
              </select>
            </div>
          );
        })}

        <div className="text-sm text-gray-600 mb-3">
          {seatCategories.map((cat, i) => {
            const count = getSeatCount(cat.name as keyof typeof seatConfig);
            return (
              <div key={i}>
                {cat.name}: {count} available
              </div>
            );
          })}
        </div>

        <div className="text-sm mb-2">
          Quantity: {Object.values(ticketSelections).reduce((sum, val) => sum + val, 0)}
        </div>
        <div className="text-sm mb-4 font-bold">
          Total: ${seatCategories.reduce((sum, cat) => sum + (ticketSelections[cat.name] || 0) * cat.price, 0)}
        </div>

        <button
          disabled={Object.values(ticketSelections).reduce((sum, val) => sum + val, 0) === 0}
          className={`w-full py-2 rounded ${
            Object.values(ticketSelections).reduce((sum, val) => sum + val, 0) === 0
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          Continue to Checkout
        </button>

      </div>
    </div>


      <a
        href="/event"
        className="inline-block mt-8 text-blue-400 hover:underline"
      >
        ← Back to Events
      </a>
    </div>
  );
}
