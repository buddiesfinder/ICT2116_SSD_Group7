// displays a main list of events and allows adding, editing, and deleting events
'use client';

import { useEffect, useState } from 'react';

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

interface CategoryPrice {
  category_id: number;
  name: string;
  price: string;
}

export default function EventPage() {
  const [role, setRole] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [formData, setFormData] = useState({
    event_id: 0,
    title: '',
    picture: null as File | null,
    description: '',
    location: ''
  });

  const defaultCategories: CategoryPrice[] = [
    { category_id: 1, name: 'Premium', price: '' },
    { category_id: 2, name: 'Standard', price: '' },
    { category_id: 3, name: 'Economy', price: '' },
  ];

  const [categories, setCategories] = useState<CategoryPrice[]>(JSON.parse(JSON.stringify(defaultCategories)));
  const [dates, setDates] = useState<EventDate[]>([{ event_date: '', start_time: '', end_time: '' }]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const roleCookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('role='))
      ?.split('=')[1];
    setRole(roleCookie || null);
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const res = await fetch('/api/events');
    const data = await res.json();
    if (data.success) setEvents(data.events);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'picture' ? prev.picture : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, picture: file }));
  };

  const handleDateChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const newDates = [...dates];
    newDates[index][e.target.name as keyof EventDate] = e.target.value;
    setDates(newDates);
  };

  const handleCategoryChange = (catIndex: number, value: string) => {
    const newCategories = [...categories];
    newCategories[catIndex].price = value;
    setCategories(newCategories);
  };

  const addDateField = () => {
    setDates([...dates, { event_date: '', start_time: '', end_time: '' }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = new FormData();
    body.append('title', formData.title);
    body.append('description', formData.description);
    body.append('location', formData.location);
    body.append('categories', JSON.stringify(categories));
    if (formData.picture) body.append('picture', formData.picture);
    body.append('dates', JSON.stringify(dates));

    const url = isEditing ? `/api/events/${formData.event_id}` : '/api/events';
    const method = isEditing ? 'PUT' : 'POST';

    const res = await fetch(url, { method, body });
    const result = await res.json();

    if (result.success) {
      setFormData({ event_id: 0, title: '', picture: null, description: '', location: '' });
      setDates([{ event_date: '', start_time: '', end_time: '' }]);
      setIsEditing(false);
      fetchEvents();
    } else {
      alert(result.message);
    }
  };

  const handleEdit = async (event: Event) => {
    setFormData({
      event_id: event.event_id,
      title: event.title,
      picture: null,
      description: event.description,
      location: event.location
    });

    const res = await fetch(`/api/events/${event.event_id}`);
    const data = await res.json();

    if (data.success) {
      if (Array.isArray(data.dates)) {
        setDates(
          data.dates.map((d: EventDate) => ({
            event_date: d.event_date.split('T')[0],
            start_time: d.start_time,
            end_time: d.end_time,
          }))
        );
      } else {
        setDates([{ event_date: '', start_time: '', end_time: '' }]);
      }

      if (Array.isArray(data.seatCategories)) {
        const updatedCategories = defaultCategories.map((cat) => {
          const match = data.seatCategories.find((item: any) => item.name === cat.name);
          return {
            ...cat,
            price: match ? match.price.toString() : '',
          };
        });
        setCategories(updatedCategories);
      }
    }
    setIsEditing(true);
  };

  const handleDelete = async (eventId: number) => {
    const confirmed = confirm('Are you sure you want to delete this event?');
    if (!confirmed) return;

    const res = await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
    const result = await res.json();
    if (result.success) fetchEvents();
    else alert(result.message);
  };

  return (
    <div className="p-6 text-white">
      {role === 'admin' && (
        <>
          <h1 className="text-2xl font-bold mb-4">{isEditing ? 'Edit Event' : 'Add Event'}</h1>
          <form onSubmit={handleSubmit} className="space-y-3 mb-10" encType="multipart/form-data">
            <input name="title" placeholder="Event Title" value={formData.title} onChange={handleChange} required className="w-full p-2 bg-zinc-800 border border-zinc-600 rounded" />
            <input name="picture" type="file" accept="image/*" onChange={handleFileChange} className="w-full p-2 bg-zinc-800 border border-zinc-600 rounded" />
            <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} required className="w-full p-2 bg-zinc-800 border border-zinc-600 rounded" />
            <input name="location" placeholder="Location" value={formData.location} onChange={handleChange} required className="w-full p-2 bg-zinc-800 border border-zinc-600 rounded" />

            <h3 className="text-lg font-semibold mt-6">Seat Category Prices</h3>
            {categories.map((cat, index) => (
              <div key={cat.category_id} className="flex items-center gap-4">
                <label className="w-24">{cat.name}</label>
                <input
                  type="number"
                  placeholder="Price"
                  value={cat.price}
                  onChange={(e) => handleCategoryChange(index, e.target.value)}
                  required={!isEditing || !cat.price}
                  className="p-2 bg-zinc-800 border border-zinc-600 rounded w-32"
                />
              </div>
            ))}

            <h3 className="text-lg font-semibold mt-6">Event Dates</h3>
            {dates.map((date, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input type="date" name="event_date" value={date.event_date} onChange={(e) => handleDateChange(index, e)} required className="p-2 bg-zinc-800 border border-zinc-600 rounded" />
                <input type="time" name="start_time" value={date.start_time} onChange={(e) => handleDateChange(index, e)} required className="p-2 bg-zinc-800 border border-zinc-600 rounded" />
                <input type="time" name="end_time" value={date.end_time} onChange={(e) => handleDateChange(index, e)} required className="p-2 bg-zinc-800 border border-zinc-600 rounded" />
              </div>
            ))}
            <div className="flex gap-4 mt-2">
              <button type="button" onClick={addDateField} className="text-blue-400 hover:underline">
                + Add Date
              </button>
              <button type="submit" className="px-4 py-2 bg-green-600 rounded hover:bg-green-700">
                {isEditing ? 'Update Event' : 'Create Event'}
              </button>
            </div>

            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({ event_id: 0, title: '', picture: null, description: '', location: '' });
                  setCategories([...defaultCategories]);
                  setDates([{ event_date: '', start_time: '', end_time: '' }]);
                }}
                className="ml-4 text-red-400 underline"
              >
                Cancel Edit
              </button>
            )}
          </form>
        </>
      )}

      <h2 className="text-xl font-bold mb-4">Upcoming Events</h2>
      <div className="grid md:grid-cols-2 gap-6">
        {events.map((event) => (
          <div key={event.event_id} className="bg-zinc-900 rounded shadow p-4">
            <img src={event.picture} alt={event.title} className="rounded mb-4 w-full max-h-96 object-contain" />
            <h3 className="text-xl font-semibold">{event.title}</h3>
            <p className="text-sm text-zinc-400">{event.location}</p>
            <p className="mt-2">{event.description}</p>
            <p className="mt-2 text-blue-300">From ${event.lowest_price}</p>
            <div className="mt-4 flex gap-2">
              <a href={`/event/${event.event_id}`} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded">View Dates</a>
              {role === 'admin' && (
                <>
                  <button onClick={() => handleEdit(event)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded">Edit</button>
                  <button onClick={() => handleDelete(event.event_id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded">Delete</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
