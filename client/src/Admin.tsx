import React, { useState } from 'react';

interface ResponseEntry {
  timestamp: string;
  [key: string]: string;
}

const Admin: React.FC = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [form, setForm] = useState({ username: '', password: '' });
  const [responses, setResponses] = useState<ResponseEntry[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setLoggedIn(true);
      loadResponses();
    } else {
      alert('Login failed');
    }
  };

  const loadResponses = () => {
    fetch('/api/admin/responses')
      .then((res) => res.json())
      .then(setResponses);
  };

  const logout = () => {
    fetch('/api/admin/logout').then(() => {
      setLoggedIn(false);
      setResponses([]);
    });
  };

  if (!loggedIn) {
    return (
      <form onSubmit={login} className="space-y-4 max-w-sm">
        <div>
          <label className="block mb-1 font-semibold">Username</label>
          <input
            name="username"
            className="w-full p-2 border rounded"
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Password</label>
          <input
            type="password"
            name="password"
            className="w-full p-2 border rounded"
            onChange={handleChange}
            required
          />
        </div>
        <button className="px-4 py-2 bg-blue-500 text-white rounded" type="submit">
          Login
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <button className="px-4 py-2 bg-gray-300 rounded" onClick={logout}>
        Logout
      </button>
      <table className="table-auto border-collapse border w-full">
        <thead>
          <tr>
            <th className="border px-2">Timestamp</th>
            {responses.length > 0 &&
              Object.keys(responses[0])
                .filter((k) => k !== 'timestamp')
                .map((key) => (
                  <th key={key} className="border px-2">
                    {key}
                  </th>
                ))}
          </tr>
        </thead>
        <tbody>
          {responses.map((r, idx) => (
            <tr key={idx}>
              <td className="border px-2">{r.timestamp}</td>
              {Object.entries(r)
                .filter(([k]) => k !== 'timestamp')
                .map(([k, v]) => (
                  <td key={k} className="border px-2">
                    {v}
                  </td>
                ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Admin;
