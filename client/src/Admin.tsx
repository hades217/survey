import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Survey {
  _id: string;
  title: string;
  description: string;
  questions: { text: string; options: string[] }[];
}

interface StatsItem {
  question: string;
  options: Record<string, number>;
}

const Admin: React.FC = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [newSurvey, setNewSurvey] = useState({ title: '', description: '' });
  const [questionForms, setQuestionForms] = useState<Record<string, { text: string; options: string }>>({});
  const [stats, setStats] = useState<Record<string, StatsItem[]>>({});

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  };

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/login', loginForm);
      setLoggedIn(true);
      loadSurveys();
    } catch {
      alert('Login failed');
    }
  };

  const loadSurveys = async () => {
    const res = await axios.get<Survey[]>('/api/admin/surveys');
    setSurveys(res.data);
  };

  const logout = async () => {
    await axios.get('/api/admin/logout');
    setLoggedIn(false);
    setSurveys([]);
  };

  const createSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await axios.post<Survey>('/api/admin/surveys', newSurvey);
    setSurveys([...surveys, res.data]);
    setNewSurvey({ title: '', description: '' });
  };

  const handleQuestionChange = (id: string, field: string, value: string) => {
    setQuestionForms({
      ...questionForms,
      [id]: { ...(questionForms[id] || { text: '', options: '' }), [field]: value },
    });
  };

  const addQuestion = async (surveyId: string) => {
    const q = questionForms[surveyId];
    if (!q || !q.text || !q.options) return;
    const options = q.options.split(',').map((o) => o.trim()).filter(Boolean);
    await axios.put(`/api/admin/surveys/${surveyId}/questions`, { text: q.text, options });
    loadSurveys();
    setQuestionForms({ ...questionForms, [surveyId]: { text: '', options: '' } });
  };

  const loadStats = async (surveyId: string) => {
    const res = await axios.get<StatsItem[]>(`/api/admin/surveys/${surveyId}/statistics`);
    setStats({ ...stats, [surveyId]: res.data });
  };

  if (!loggedIn) {
    return (
      <form onSubmit={login} className="space-y-4 max-w-sm mx-auto">
        <div>
          <label className="block mb-1 font-semibold">Username</label>
          <input
            name="username"
            className="w-full p-2 border rounded"
            onChange={handleLoginChange}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Password</label>
          <input
            type="password"
            name="password"
            className="w-full p-2 border rounded"
            onChange={handleLoginChange}
            required
          />
        </div>
        <button className="px-4 py-2 bg-blue-500 text-white rounded" type="submit">Login</button>
      </form>
    );
  }

  return (
    <div className="space-y-8 p-4">
      <button className="px-4 py-2 bg-gray-300 rounded" onClick={logout}>Logout</button>

      <form onSubmit={createSurvey} className="space-y-2 max-w-md">
        <h2 className="text-lg font-bold">Create Survey</h2>
        <input
          className="w-full p-2 border rounded"
          placeholder="Title"
          value={newSurvey.title}
          onChange={(e) => setNewSurvey({ ...newSurvey, title: e.target.value })}
          required
        />
        <input
          className="w-full p-2 border rounded"
          placeholder="Description"
          value={newSurvey.description}
          onChange={(e) => setNewSurvey({ ...newSurvey, description: e.target.value })}
          required
        />
        <button className="px-4 py-2 bg-blue-500 text-white rounded" type="submit">Create</button>
      </form>

      <div className="space-y-6">
        {surveys.map((s) => (
          <div key={s._id} className="border p-4 rounded space-y-2">
            <div className="font-bold text-lg">{s.title}</div>
            <div className="text-gray-600">{s.description}</div>
            <ul className="list-disc pl-5">
              {s.questions.map((q, idx) => (
                <li key={idx}>{q.text}</li>
              ))}
            </ul>

            <div className="flex space-x-2">
              <input
                className="flex-1 p-2 border rounded"
                placeholder="Question text"
                value={questionForms[s._id]?.text || ''}
                onChange={(e) => handleQuestionChange(s._id, 'text', e.target.value)}
              />
              <input
                className="flex-1 p-2 border rounded"
                placeholder="Options (comma separated)"
                value={questionForms[s._id]?.options || ''}
                onChange={(e) => handleQuestionChange(s._id, 'options', e.target.value)}
              />
              <button
                className="px-2 py-1 bg-green-500 text-white rounded"
                onClick={() => addQuestion(s._id)}
                type="button"
              >
                Add
              </button>
            </div>

            <button
              className="mt-2 px-4 py-1 bg-purple-500 text-white rounded"
              onClick={() => loadStats(s._id)}
              type="button"
            >
              View Statistics
            </button>

            {stats[s._id] && (
              <div className="mt-2">
                {stats[s._id].map((st, idx) => (
                  <div key={idx} className="mb-2">
                    <div className="font-semibold">{st.question}</div>
                    <ul className="list-disc pl-5">
                      {Object.entries(st.options).map(([opt, count]) => (
                        <li key={opt}>{opt}: {count}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Admin;
