'use client';

import ProtectedImage from '@/app/(components)/protectedimage';
import { useState } from 'react';

interface Booking {
  booking_id: number;
  event_title: string;
  event_picture: string;
  quantity: number;
  amount_payable: number;
  booked_at: string;
  status: string;
  redeemed: string;
  seat_category: string;
  event_date: string;
  start_time: string;
  end_time: string;
}

export default function ClientProfile({
  email,
  role,
  name: initialName,
}: {
  email: string | null;
  role: string | null;
  name: string | null;
}) {
  const [name, setName] = useState(initialName || '');
  const [editingName, setEditingName] = useState(!initialName); // auto-edit if no name
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showBookings, setShowBookings] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadBookings = async () => {
    setLoading(true);
    console.log('Loading bookings...'); // Debugging line to track function call
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      console.log('Bookings data:', data); // Debugging line to check response structure
      if (data.success) {
        setBookings(data.bookings);
        setShowBookings(true);
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error('Error loading bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-4">Profile</h1>

      <p className="text-lg mb-4">
        Name:{' '}
        {!editingName && name ? (
          <>
            <span className="text-yellow-300">{name}</span>
            <button
              onClick={() => setEditingName(true)}
              className="ml-3 text-blue-400 underline"
            >
              Edit
            </button>
          </>
        ) : (
          <>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="p-1 bg-zinc-700 border border-zinc-600 rounded text-white"
            />
            <button
              onClick={async () => {
                const res = await fetch('/api/profile', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name }),
                });
                const result = await res.json();
                if (result.success) {
                  setEditingName(false);
                } else {
                  alert(result.message);
                }
              }}
              className="ml-2 text-green-400 underline"
            >
              Save
            </button>
            {initialName && (
              <button
                onClick={() => {
                  setEditingName(false);
                  setName(initialName); // reset to original
                }}
                className="ml-2 text-red-400 underline"
              >
                Cancel
              </button>
            )}
          </>
        )}
      </p>

      <p className="text-lg mb-4">
        Email: <span className="text-blue-300">{email || '...'}</span>
      </p>
      <p className="text-lg mb-6">
        Role: <span className="text-green-300">{role || 'unknown'}</span>
      </p>

      <button
        onClick={loadBookings}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded mb-6"
      >
        {showBookings ? 'Refresh Bookings' : 'View Bookings'}
      </button>

      {loading && <p>Loading bookings...</p>}

      {showBookings &&
        (bookings.length === 0 ? (
          <p>No bookings found.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {bookings.map((b) => (
              <div key={b.booking_id} className="bg-zinc-900 rounded shadow p-4">
                <ProtectedImage
                  src={b.event_picture}
                  alt={b.event_title}
                  className="rounded mb-3 w-full max-h-60 object-contain"
                />
                <h2 className="text-xl font-semibold">{b.event_title}</h2>
                <p className="text-sm text-zinc-400">
                  {b.seat_category} • {b.quantity} ticket(s)
                </p>
                <p className="text-sm text-zinc-400">
                  {b.event_date.split('T')[0]} • {b.start_time.slice(0, 5)} -{' '}
                  {b.end_time.slice(0, 5)}
                </p>
                <p className="mt-2">
                  Total:{' '}
                  <span className="text-green-400">
                    ${Number(b.amount_payable).toFixed(2)}
                  </span>
                </p>
                <p>
                  Status: <span className="text-blue-300">{b.status}</span>
                </p>
                <p>
                  Redeemed: <span className="text-yellow-300">{b.redeemed}</span>
                </p>
                <p className="text-sm text-zinc-500 mt-2">
                  Booked at: {new Date(b.booked_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}
