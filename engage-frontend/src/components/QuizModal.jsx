import { useState, useEffect } from "react";
import Button from "./ui/Button";
import Input from "./ui/Input";
import { quiz as quizAPI } from "../lib/api";

/**
 * Quiz Modal Component
 * Displays quiz questions after watch duration is complete
 * Shows partial reward tiers and collects answers
 */
export default function QuizModal({ campaignId, verificationToken, onComplete, onError, onCancel, popupRef, campaignUrl }) {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch quiz questions on mount
  useEffect(() => {
    fetchQuiz();
  }, [campaignId]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const data = await quizAPI.getQuestions(campaignId);
      setQuiz(data);

      // Initialize answers object
      const initialAnswers = {};
      data.questions.forEach((q) => {
        initialAnswers[q.question_id] = '';
      });
      setAnswers(initialAnswers);
    } catch (error) {
      console.error('Error fetching quiz:', error);
      onError(error.message || 'Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleViewWebsite = () => {
    console.log('View Website clicked, popupRef:', popupRef);
    console.log('popupRef.current:', popupRef?.current);
    console.log('popup closed?', popupRef?.current?.closed);

    // Check if popup exists and is still open
    if (!popupRef || !popupRef.current || popupRef.current.closed) {
      // Popup was closed or doesn't exist - reopen it
      try {
        const width = 1200;
        const height = 800;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const newPopup = window.open(
          campaignUrl,
          `campaign_${campaignId}`,
          `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=yes,status=yes,menubar=no,scrollbars=yes,resizable=yes`
        );

        if (newPopup) {
          // Update the ref with the new popup
          if (popupRef) {
            popupRef.current = newPopup;
          }
          console.log('Opened new popup window');
        } else {
          onError('Popup was blocked. Please allow popups and try again.');
        }
      } catch (err) {
        console.error('Error opening popup:', err);
        onError('Unable to open website popup. Please check popup blocker settings.');
      }
      return;
    }

    try {
      // Popup exists and is open - just focus it
      popupRef.current.focus();
      console.log('Focused existing popup window');
    } catch (err) {
      console.error('Error focusing popup:', err);
      onError('Unable to focus the popup window. Please click on it manually.');
    }
  };

  const handleSubmit = async () => {
    // Validate all questions are answered
    const unanswered = Object.entries(answers).filter(([_, answer]) => !answer || answer.trim() === '');
    if (unanswered.length > 0) {
      onError('Please answer all questions before submitting');
      return;
    }

    try {
      setSubmitting(true);

      // Format answers for API
      const formattedAnswers = Object.entries(answers).map(([question_id, answer]) => ({
        question_id: Number(question_id),
        answer: answer,
      }));

      const result = await quizAPI.submitAnswers(verificationToken, formattedAnswers);
      onComplete(result);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      onError(error.message || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
          <div className="text-center">
            <div className="text-lg font-semibold">Loading Quiz...</div>
            <div className="mt-2 text-slate-600">Please wait</div>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return null;
  }

  // Calculate reward tiers for display
  const fullReward = quiz.full_reward || 0;
  const rewardTiers = [
    { correct: 5, multiplier: 1.0, reward: fullReward * 1.0, label: '100%' },
    { correct: 4, multiplier: 0.8, reward: fullReward * 0.8, label: '80%' },
    { correct: 3, multiplier: 0.6, reward: fullReward * 0.6, label: '60%' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-sky-600 text-white px-6 py-4 rounded-t-lg">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">Quiz Time! 🎯</h2>
              <p className="text-sm mt-1 opacity-90">
                Answer at least 3 questions correctly to earn your reward
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-white hover:text-red-200 transition text-2xl font-bold"
              title="Cancel quiz"
            >
              ×
            </button>
          </div>
        </div>

        {/* Reward Tiers */}
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
          <div className="text-sm font-semibold text-blue-900 mb-2">Reward Tiers:</div>
          <div className="flex gap-4 text-sm">
            {rewardTiers.map((tier) => (
              <div key={tier.correct} className="flex items-center gap-2">
                <span className="font-medium text-blue-800">{tier.correct}/5:</span>
                <span className="font-semibold text-teal-700">
                  {tier.reward.toFixed(1)} coins ({tier.label})
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-blue-700 mt-2">
            ⚠️ Less than 3 correct = No reward
          </p>
        </div>

        {/* Questions */}
        <div className="px-6 py-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {quiz.questions.map((question, index) => (
            <div key={question.question_id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <div className="font-semibold text-slate-900 mb-3">
                {index + 1}. {question.text}
              </div>

              {/* MCQ */}
              {question.input_type === 'mcq' && (
                <div className="space-y-2">
                  {question.options.map((option, optIndex) => (
                    <label
                      key={optIndex}
                      className="flex items-center gap-3 p-3 bg-white border border-slate-300 rounded-md hover:border-teal-500 cursor-pointer transition"
                    >
                      <input
                        type="radio"
                        name={`question-${question.question_id}`}
                        value={option.text}
                        checked={answers[question.question_id] === option.text}
                        onChange={(e) => handleAnswerChange(question.question_id, e.target.value)}
                        className="w-4 h-4 text-teal-600"
                      />
                      <span className="text-slate-700">{option.text}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Dropdown */}
              {question.input_type === 'dropdown' && (
                <select
                  value={answers[question.question_id] || ''}
                  onChange={(e) => handleAnswerChange(question.question_id, e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="">-- Select an answer --</option>
                  {question.options.map((option, optIndex) => (
                    <option key={optIndex} value={option.text}>
                      {option.text}
                    </option>
                  ))}
                </select>
              )}

              {/* Free Text */}
              {question.input_type === 'free_text' && (
                <Input
                  value={answers[question.question_id] || ''}
                  onChange={(e) => handleAnswerChange(question.question_id, e.target.value)}
                  placeholder="Type your answer here"
                  maxLength={120}
                />
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 rounded-b-lg border-t border-slate-200 space-y-3">
          <div className="flex items-center gap-3">
            <Button
              onClick={handleViewWebsite}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3"
            >
              🌐 View Website
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-3"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </Button>
          </div>
          <p className="text-xs text-slate-600 text-center">
            💡 Click "View Website" to check the site before answering
          </p>
        </div>
      </div>
    </div>
  );
}
