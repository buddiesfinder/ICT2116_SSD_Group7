'use client';

import { useEffect, useState } from 'react';

interface Admin {
  user_id: number;
  name: string;
  email: string;
  suspended: boolean;
}

export default function AdminPage() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);

  const fetchAdmins = async () => {
    const res = await fetch('/api/admin');
    const data = await res.json();
    if (data.success) setAdmins(data.admins);
  };

  useEffect(() => {
    setFormData({ name: '', email: '', password: '' });
    fetchAdmins();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const result = await res.json();
    if (result.success) {
      setMessage({ text: 'Admin created successfully.', type: 'success' });
      setFormData({ name: '', email: '', password: '' });
      fetchAdmins();
    } else {
      setMessage({ text: result.message || 'Failed to create admin.', type: 'error' });
    }
  };

  const toggleBan = async (userId: number, currentlyBanned: boolean) => {
    const res = await fetch(`/api/admin`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, suspended: !currentlyBanned }),
    });

    const result = await res.json();
    if (result.success) {
      fetchAdmins();
    } else {
      alert(result.message || 'Failed to update ban status.');
    }
  };  

  return (
    <div className="p-6 max-w-3xl mx-auto text-white">
      <h2 className="text-2xl font-bold mb-4">Create Admin Account</h2>

      <form onSubmit={handleSubmit} className="space-y-4 mb-8" autoComplete="off">
        <input
          type="text"
          name="name"
          autoComplete="off"
          value={formData.name}
          onChange={handleChange}
          placeholder="Name"
          required
          className="w-full p-2 bg-zinc-800 border border-zinc-600 rounded"
        />

        <input
          type="email"
          name="email"
          autoComplete="off"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email Address"
          required
          className="w-full p-2 bg-zinc-800 border border-zinc-600 rounded"
        />

        <input
          type="password"
          name="password"
          autoComplete="new-password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Password"
          required
          className="w-full p-2 bg-zinc-800 border border-zinc-600 rounded"
        />

        <button type="submit" className="px-4 py-2 bg-green-600 rounded hover:bg-green-700">
          Create Admin
        </button>
      </form>

      {message && (
        <p className={`mb-6 ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
          {message.text}
        </p>
      )}

      <h3 className="text-2xl font-semibold mb-4">Existing Admins</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse border border-zinc-700">
          <thead className="bg-zinc-800">
            <tr>
              <th className="p-2 border border-zinc-700">Name</th>
              <th className="p-2 border border-zinc-700">Email</th>
              <th className="p-2 border border-zinc-700">Status</th>
              <th className="p-2 border border-zinc-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {admins.length > 0 ? (
              admins.map((admin) => (
                <tr key={admin.user_id} className="bg-zinc-900">
                  <td className="p-2 border border-zinc-700">{admin.name}</td>
                  <td className="p-2 border border-zinc-700">{admin.email}</td>                
                  <td className="p-2 border border-zinc-700">
                    {admin.suspended ? (
                      <span className="text-red-400">Banned</span>
                    ) : (
                      <span className="text-green-400">Active</span>
                    )}
                  </td>
                  <td className="p-2 border border-zinc-700">
                    <button
                      onClick={() => toggleBan(admin.user_id, admin.suspended)}
                      className={`px-2 py-1 rounded text-sm ${
                        admin.suspended
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-red-600 hover:bg-red-700'
                        }`}
                        >
                        {admin.suspended ? 'Un-ban' : 'Ban'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-2 text-center text-zinc-400">
                  No admin accounts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
