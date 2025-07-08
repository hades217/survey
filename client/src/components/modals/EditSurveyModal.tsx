import React from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { useSurveys } from '../../hooks/useSurveys';

interface ModalProps {
  show: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ show, title, onClose, children }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {children}
        </div>
      </div>
    </div>
  );
};

const EditSurveyModal: React.FC = () => {
  const {
    showEditModal,
    setShowEditModal,
    editForm,
    setEditForm,
    selectedSurvey,
    loading,
    setLoading,
    setError
  } = useAdmin();
  
  const { updateSurvey } = useSurveys();

  if (!selectedSurvey || !showEditModal) return null;

  const closeEditModal = () => {
    setShowEditModal(false);
  };

  const handleUpdateSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const surveyData = {
        ...editForm,
        // Ensure isActive matches status for backward compatibility
        isActive: editForm.status === 'active',
        timeLimit: editForm.timeLimit ? Number(editForm.timeLimit) : undefined,
        maxAttempts: editForm.maxAttempts || 1,
      };

      await updateSurvey(selectedSurvey._id, surveyData);
      closeEditModal();
    } catch (err) {
      setError('Failed to update survey. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      show={showEditModal}
      title={`Edit Survey: ${selectedSurvey.title}`}
      onClose={closeEditModal}
    >
      <form onSubmit={handleUpdateSurvey} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            className="input-field"
            placeholder="Enter survey title"
            value={editForm.title}
            onChange={e => setEditForm({ ...editForm, title: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            className="input-field"
            placeholder="Enter description"
            value={editForm.description}
            onChange={e =>
              setEditForm({ ...editForm, description: e.target.value })
            }
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              className="input-field"
              value={editForm.type}
              onChange={e =>
                setEditForm({ ...editForm, type: e.target.value as any })
              }
            >
              <option value="survey">Survey</option>
              <option value="assessment">Assessment</option>
              <option value="quiz">Quiz</option>
              <option value="iq">IQ Test</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              className="input-field"
              value={editForm.status}
              onChange={e => setEditForm({ ...editForm, status: e.target.value as 'draft' | 'active' | 'closed' })}
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Enhanced settings for quiz/assessment/iq */}
        {['quiz', 'assessment', 'iq'].includes(editForm.type) && (
          <div className="bg-blue-50 rounded-lg p-4 space-y-4">
            <h4 className="font-medium text-gray-800">Assessment Configuration</h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Limit (minutes)
                </label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="No limit"
                  value={editForm.timeLimit || ''}
                  onChange={e =>
                    setEditForm({
                      ...editForm,
                      timeLimit: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                  min="1"
                  max="300"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Leave empty for no time limit
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Attempts
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={editForm.maxAttempts}
                  onChange={e =>
                    setEditForm({
                      ...editForm,
                      maxAttempts: parseInt(e.target.value) || 1,
                    })
                  }
                  min="1"
                  max="10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Navigation Mode
              </label>
              <select
                className="input-field"
                value={editForm.navigationMode}
                onChange={e =>
                  setEditForm({
                    ...editForm,
                    navigationMode: e.target.value as
                      | 'step-by-step'
                      | 'paginated'
                      | 'all-in-one',
                  })
                }
              >
                <option value="step-by-step">Step-by-step (Recommended)</option>
                <option value="paginated">Paginated</option>
                <option value="all-in-one">All-in-one</option>
              </select>
              <div className="text-xs text-gray-500 mt-1">
                Step-by-step: Display one question at a time for best experience
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Instructions
              </label>
              <textarea
                className="input-field"
                placeholder="Additional instructions or notes for students"
                value={editForm.instructions}
                onChange={e =>
                  setEditForm({ ...editForm, instructions: e.target.value })
                }
                rows={3}
              />
              <div className="text-xs text-gray-500 mt-1">
                These instructions will be shown to students before starting the
                assessment
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t">
          <button className="btn-primary flex-1" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            className="btn-secondary px-6"
            onClick={closeEditModal}
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditSurveyModal;