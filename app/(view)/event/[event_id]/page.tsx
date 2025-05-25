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
      <a
        href="/event"
        className="inline-block mt-8 text-blue-400 hover:underline"
      >
        ← Back to Events
      </a>
    </div>
  );
}
