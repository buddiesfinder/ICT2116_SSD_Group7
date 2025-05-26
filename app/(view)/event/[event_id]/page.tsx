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
  const [selectedCategory, setSelectedCategory] = useState<{ name: string; price: number } | null>(null);
  const [ticketCount, setTicketCount] = useState(1);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [availableSeats, setAvailableSeats] = useState<number>(0);

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
      for (let c = 0; c < cols; c++) {
        const seatId = `${section}-${r}-${c}`;
        const isSelected = selectedSeats.includes(seatId);
        row.push(
          <div
            key={seatId}
            onClick={() => handleSeatToggle(seatId)}
            className={`w-5 h-5 m-0.5 rounded cursor-pointer ${
              isSelected ? 'bg-yellow-400' : color
            }`}
            title={seatId}
          />
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

  const handleSeatToggle = (seatId: string) => {
    setSelectedSeats(prev =>
      prev.includes(seatId)
        ? prev.filter(id => id !== seatId)
        : [...prev, seatId]
    );
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
      <h3 className="font-bold text-lg mb-3 text-gray-600">Select Your Seats</h3>
      <div className="bg-gray-800 text-white text-center py-2 rounded-t">STAGE</div>

      {/* Premium */}
      <div className="mt-4">
        <div className="text-center font-semibold text-red-500 mb-1">Premium</div>
        {renderSeatGrid(2, 25, 'Premium', 'bg-red-400')}
      </div>

      {/* Standard */}
      <div className="mt-4">
        <div className="text-center font-semibold text-blue-500 mb-1">Standard</div>
        {renderSeatGrid(4, 25, 'Standard', 'bg-blue-200')}
      </div>

      {/* Economy */}
      <div className="mt-4">
        <div className="text-center font-semibold text-green-500 mb-1">Economy</div>
        {renderSeatGrid(6, 25, 'Economy', 'bg-green-200')}
      </div>

      {/* Exits */}
      <div className="mt-4 flex justify-between text-xs text-gray-500">
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
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-400 rounded-sm" /> Selected
        </div>
      </div>
    </div>

      {/* Right: Seat Selection Panel */}
      <div className="w-full lg:w-80 bg-white rounded p-6 text-black shadow-md">
        <h4 className="font-semibold text-lg text-gray-700 mb-2">Your Selection</h4>

        <label className="block text-sm font-medium mb-1">Seat Category</label>
        <select
          className="w-full border border-gray-300 rounded px-3 py-2 mb-3"
          onChange={(e) => {
            const selected = seatCategories.find(cat => cat.name === e.target.value);
            setSelectedCategory(selected || null);
          }}
        >
          <option value="">-- Select --</option>
          {seatCategories.map((cat, i) => (
            <option key={i} value={cat.name}>
              {cat.name} - ${cat.price}
            </option>
          ))}
        </select>

        {selectedCategory && (
          <>
            <label className="block text-sm font-medium mb-1">Number of Tickets</label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
              onChange={(e) => setTicketCount(Number(e.target.value))}
            >
              {[...Array(10)].map((_, i) => (
                <option key={i} value={i + 1}>{i + 1} ticket(s)</option>
              ))}
            </select>

            <div className="text-sm text-gray-600 mb-3">
              Available Seats: {150 - selectedSeats.length}
            </div>

            <div className="text-sm mb-2">Tickets ({ticketCount})</div>
            <div className="text-sm mb-4 font-bold">
              Total: ${ticketCount * selectedCategory.price}
            </div>
          </>
        )}

        <button className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2 rounded">
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
