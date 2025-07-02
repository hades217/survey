import React, { useEffect, useState } from 'react';

interface Question {
  id: string;
  text: string;
}

const Survey: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch('/api/questions')
      .then((res) => res.json())
      .then(setQuestions);
  }, []);

  const handleChange = (id: string, value: string) => {
    setFormData({ ...formData, [id]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    setSubmitted(true);
  };

  if (submitted) {
    return <div>Thanks for your response!</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      {questions.map((q) => (
        <div key={q.id}>
          <label className="block mb-1 font-semibold">{q.text}</label>
          <input
            className="w-full p-2 border rounded"
            onChange={(e) => handleChange(q.id, e.target.value)}
            required
          />
        </div>
      ))}
      <button className="px-4 py-2 bg-blue-500 text-white rounded" type="submit">
        Submit
      </button>
    </form>
  );
};

export default Survey;
