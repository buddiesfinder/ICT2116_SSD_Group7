// components/EventList.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Define TypeScript interfaces for our data structures
interface EventPricing {
  cat1: number;
  cat2: number;
  cat3: number;
}

interface Event {
  id: string;
  title: string;
  date: string;
  venue: string;
  description: string;
  pricing: EventPricing;
  imageUrl?: string; // Optional image URL
}
export function getEvents() {
  return [
    {
      id: '1',
      title: 'Taylor Swift - The Eras Tour',
      date: 'June 10, 2025',
      venue: 'Madison Square Garden, New York',
      description: 'Experience the musical journey through Taylor Swift\'s iconic eras in this spectacular concert event.',
      pricing: {
        cat1: 350,
        cat2: 250,
        cat3: 150
      }
    },

    {
      id: '2',
      title: 'Taylor Swift - The Eras Tour',
      date: 'June 10, 2025',
      venue: 'Madison Square Garden, New York',
      description: 'Experience the musical journey through Taylor Swift\'s iconic eras in this spectacular concert event.',
      pricing: {
        cat1: 350,
        cat2: 250,
        cat3: 150
      }
    },
    // More events...
  ];
}
export default function EventList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchEvents = async (): Promise<void> => {
      try {
        // In a real app, fetch this from an API
        const eventsData = getEvents();
        setEvents(eventsData);
      } catch (error) {
        console.error("Failed to fetch events", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (isLoading) return <div className="text-center p-12">Loading events...</div>;
  if (events.length === 0) return <div className="text-center p-12">No events found</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <Link key={event.id} href={`/event/${event.id}`}>
          <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full">
            <div className="relative h-48 bg-gray-200">
              {/* Optional image display */}
              {event.imageUrl && (
                <img 
                  src={event.imageUrl} 
                  alt={event.title} 
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-70"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <p className="text-lg font-bold">{event.date}</p>
              </div>
            </div>
            <div className="p-6">
              <h2 className="text-xl font-bold mb-2">{event.title}</h2>
              <p className="text-gray-600 mb-4">{event.venue}</p>
              <p className="text-gray-800 mb-6 line-clamp-3">{event.description}</p>
              <div className="flex justify-between items-center">
                <p className="font-semibold">From ${event.pricing.cat3}</p>
                <span className="px-4 py-2 bg-blue-600 text-white rounded-md">View Tickets</span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}