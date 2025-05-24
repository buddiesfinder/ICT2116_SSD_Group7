// displays a form to edit an existing event, currently not needed
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function EditEventPage() {
  const { event_id } = useParams();
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    price: '',
  });

  useEffect(() => {
    const fetchEvent = async () => {
      const res = await fetch(`/api/events/${event_id}`);
      const data = await res.json();
      if (data.success) {
        setFormData({
          title: data.event.title,
          description: data.event.description,
          location: data.event.location,
          price: data.event.price,
        });
      }
    };
    fetchEvent();
  }, [event_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/events/${event_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const result = await res.json();
    if (result.success) {
      alert('Event updated successfully');
      router.push('/event');
    } else {
      alert('Failed to update');
    }
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Edit Event</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input name="title" value={formData.title} onChange={handleChange} placeholder="Title" className="w-full p-2 bg-zinc-800 border border-zinc-600 rounded" required />
        <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" className="w-full p-2 bg-zinc-800 border border-zinc-600 rounded" required />
        <input name="location" value={formData.location} onChange={handleChange} placeholder="Location" className="w-full p-2 bg-zinc-800 border border-zinc-600 rounded" required />
        <input name="price" type="number" value={formData.price} onChange={handleChange} placeholder="Price" className="w-full p-2 bg-zinc-800 border border-zinc-600 rounded" required />
        <button type="submit" className="bg-green-600 px-4 py-2 rounded hover:bg-green-700">Update</button>
      </form>
    </div>
  );
}
