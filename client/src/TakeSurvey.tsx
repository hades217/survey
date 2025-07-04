import React, { useEffect, useState } from 'react';
import axios from 'axios';
import type { SurveyResponse } from '../../shared/surveyResponse';

interface Survey {
  _id: string;
  title: string;
  description: string;
  questions: { _id: string; text: string; options: string[] }[];
}

interface FormState {
  name: string;
  email: string;
  answers: Record<string, string>;
}

const TakeSurvey: React.FC = () => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [form, setForm] = useState<FormState>({ name: '', email: '', answers: {} });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    axios.get<Survey[]>('/api/surveys').then(res => setSurveys(res.data));
  }, []);

  useEffect(() => {
    if (selectedId) {
      axios.get<Survey>(`/api/surveys/${selectedId}`).then(res => {
        setSurvey(res.data);
        setForm({ name: '', email: '', answers: {} });
        setSubmitted(false);
      });
    }
  }, [selectedId]);

  const handleAnswerChange = (qid: string, value: string) => {
    setForm({ ...form, answers: { ...form.answers, [qid]: value } });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!survey) return;
    const payload: SurveyResponse = {
      name: form.name,
      email: form.email,
      surveyId: survey._id,
      answers: survey.questions.map((q) => form.answers[q._id]),
    };
    await axios.post(`/api/surveys/${survey._id}/responses`, payload);
    setSubmitted(true);
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto p-4">
      <div>
        <label className="block mb-1 font-semibold">Choose Survey</label>
        <select
          className="w-full p-2 border rounded"
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
        >
          <option value="">Select...</option>
          {surveys.map(s => (
            <option key={s._id} value={s._id}>
              {s.title}
            </option>
          ))}
        </select>
      </div>

      {survey && !submitted && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-semibold">Name</label>
            <input
              className="w-full p-2 border rounded"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Email</label>
            <input
              type="email"
              className="w-full p-2 border rounded"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          {survey.questions.map(q => (
            <div key={q._id}>
              <label className="block mb-1 font-semibold">{q.text}</label>
              {q.options.map(opt => (
                <label key={opt} className="block">
                  <input
                    type="radio"
                    name={q._id}
                    className="mr-2"
                    value={opt}
                    onChange={() => handleAnswerChange(q._id, opt)}
                    required
                  />
                  {opt}
                </label>
              ))}
            </div>
          ))}
          <button className="px-4 py-2 bg-blue-500 text-white rounded" type="submit">
            Submit
          </button>
        </form>
      )}

      {submitted && <div>Thanks for your response!</div>}
    </div>
  );
};

export default TakeSurvey;
