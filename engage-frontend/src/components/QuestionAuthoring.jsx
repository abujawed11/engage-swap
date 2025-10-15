import { useState, useEffect } from "react";
import Label from "./ui/Label";
import Input from "./ui/Input";
import Button from "./ui/Button";

// Question bank with 20 standard questions and smart default options for ALL input types
const QUESTION_BANK = [
  {
    id: 1,
    text: "What is the primary color used in the website's logo?",
    category: "visual",
    defaultOptions: ["Blue", "Red", "Green", "Black"],
    defaultAnswer: "Blue"
  },
  {
    id: 2,
    text: "What is the main product or service offered?",
    category: "content",
    defaultOptions: ["Software Solutions", "Consulting Services", "E-commerce Platform", "Digital Marketing"],
    defaultAnswer: "Software Solutions"
  },
  {
    id: 3,
    text: "What is the company or website name?",
    category: "content",
    defaultOptions: ["TechCorp", "Innovation Labs", "Digital Solutions", "Global Services"],
    defaultAnswer: "Company Name"
  },
  {
    id: 4,
    text: "What is the tagline or slogan displayed on the homepage?",
    category: "content",
    defaultOptions: ["Your Success Partner", "Innovation Delivered", "Building Tomorrow", "Trusted Worldwide"],
    defaultAnswer: "Your Success Partner"
  },
  {
    id: 5,
    text: "How many main navigation menu items are there?",
    category: "visual",
    defaultOptions: ["3", "4", "5", "6"],
    defaultAnswer: "5"
  },
  {
    id: 6,
    text: "What is the call-to-action text on the main button?",
    category: "content",
    defaultOptions: ["Get Started", "Sign Up Free", "Learn More", "Contact Us"],
    defaultAnswer: "Get Started"
  },
  {
    id: 7,
    text: "What email address or contact method is displayed?",
    category: "content",
    defaultOptions: ["contact@example.com", "info@company.com", "support@website.com", "hello@business.com"],
    defaultAnswer: "contact@example.com"
  },
  {
    id: 8,
    text: "What year was the company founded (if mentioned)?",
    category: "content",
    defaultOptions: ["2020", "2021", "2022", "2023"],
    defaultAnswer: "2020"
  },
  {
    id: 9,
    text: "What social media platform is linked first?",
    category: "content",
    defaultOptions: ["Facebook", "Twitter", "LinkedIn", "Instagram"],
    defaultAnswer: "Facebook"
  },
  {
    id: 10,
    text: "What is the first benefit or feature mentioned?",
    category: "content",
    defaultOptions: ["Fast Performance", "Easy to Use", "Secure & Reliable", "24/7 Support"],
    defaultAnswer: "Fast Performance"
  },
  {
    id: 11,
    text: "What is the background color of the header?",
    category: "visual",
    defaultOptions: ["White", "Black", "Blue", "Gray"],
    defaultAnswer: "White"
  },
  {
    id: 12,
    text: "What type of pricing model is offered?",
    category: "content",
    defaultOptions: ["Subscription", "One-time Payment", "Freemium", "Pay-per-use"],
    defaultAnswer: "Subscription"
  },
  {
    id: 13,
    text: "What is mentioned in the hero section headline?",
    category: "content",
    defaultOptions: ["Transform Your Business", "Welcome to Innovation", "Empowering Success", "Your Digital Partner"],
    defaultAnswer: "Transform Your Business"
  },
  {
    id: 14,
    text: "How many testimonials or reviews are visible?",
    category: "visual",
    defaultOptions: ["2", "3", "4", "5"],
    defaultAnswer: "3"
  },
  {
    id: 15,
    text: "What is the footer copyright text?",
    category: "content",
    defaultOptions: ["© 2024 Company. All rights reserved.", "© 2024 All Rights Reserved", "Copyright 2024", "© Company 2024"],
    defaultAnswer: "© 2024 Company. All rights reserved."
  },
  {
    id: 16,
    text: "What industry or sector does the website serve?",
    category: "content",
    defaultOptions: ["Technology", "Healthcare", "Finance", "Education"],
    defaultAnswer: "Technology"
  },
  {
    id: 17,
    text: "What is the first word in the main headline?",
    category: "content",
    defaultOptions: ["Welcome", "Discover", "Transform", "Experience"],
    defaultAnswer: "Welcome"
  },
  {
    id: 18,
    text: "What icon or image is used in the hero section?",
    category: "visual",
    defaultOptions: ["Laptop", "People", "Graph", "Building"],
    defaultAnswer: "Laptop"
  },
  {
    id: 19,
    text: "What customer support option is available?",
    category: "content",
    defaultOptions: ["Live Chat", "Email Support", "Phone Support", "Help Center"],
    defaultAnswer: "Live Chat"
  },
  {
    id: 20,
    text: "What location or region is mentioned?",
    category: "content",
    defaultOptions: ["United States", "United Kingdom", "Europe", "Global"],
    defaultAnswer: "United States"
  },
];

const INPUT_TYPES = {
  DROPDOWN: "dropdown",
  MCQ: "mcq",
  FREE_TEXT: "free_text",
};

// Smart default options generator based on question
const generateDefaultOptions = (questionId, inputType) => {
  const question = QUESTION_BANK.find(q => q.id === questionId);
  if (!question) return [];

  // Use question-specific defaults if available
  if (question.defaultOptions && question.defaultOptions.length > 0) {
    if (inputType === INPUT_TYPES.MCQ) {
      // Use first 4 default options for MCQ
      const options = question.defaultOptions.slice(0, 4);
      return options.map((text, index) => ({
        text,
        is_correct: index === 0, // First option is correct by default
      }));
    } else if (inputType === INPUT_TYPES.DROPDOWN) {
      // Use all default options for dropdown (or first 3-4)
      return question.defaultOptions.slice(0, 4).map((text, index) => ({
        text,
        is_correct: index === 0, // First option is correct by default
      }));
    }
  }

  // Fallback to generic options if no defaults
  if (inputType === INPUT_TYPES.MCQ) {
    return [
      { text: "Option A", is_correct: true },
      { text: "Option B", is_correct: false },
      { text: "Option C", is_correct: false },
      { text: "Option D", is_correct: false },
    ];
  } else if (inputType === INPUT_TYPES.DROPDOWN) {
    return [
      { text: "Option 1", is_correct: true },
      { text: "Option 2", is_correct: false },
      { text: "Option 3", is_correct: false },
    ];
  }
  return [];
};

/**
 * Question Authoring Component
 * Allows campaigner to select 5 questions from the bank and configure answers
 * Pre-fills with smart defaults to reduce user friction
 */
export default function QuestionAuthoring({ questions, onChange, error }) {
  const [selectedQuestions, setSelectedQuestions] = useState(questions || []);

  // Initialize with pre-selected questions and smart defaults
  useEffect(() => {
    if (!questions || questions.length === 0) {
      // Pre-select first 5 questions from bank with smart defaults
      const initial = QUESTION_BANK.slice(0, 5).map((q, index) => {
        const inputType = index < 3 ? INPUT_TYPES.MCQ : (index === 3 ? INPUT_TYPES.DROPDOWN : INPUT_TYPES.FREE_TEXT);

        if (inputType === INPUT_TYPES.FREE_TEXT) {
          return {
            question_id: q.id,
            input_type: inputType,
            config: {
              correct_answer: q.defaultAnswer || "Answer",
              synonyms: [],
            },
          };
        } else {
          return {
            question_id: q.id,
            input_type: inputType,
            config: { options: generateDefaultOptions(q.id, inputType) },
          };
        }
      });

      setSelectedQuestions(initial);
      onChange(initial);
    }
  }, []);

  const handleQuestionSelect = (index, questionId) => {
    const updated = [...selectedQuestions];
    const currentInputType = updated[index].input_type;

    if (questionId) {
      const question = QUESTION_BANK.find(q => q.id === Number(questionId));

      // Update with new question and regenerate defaults based on the question
      if (currentInputType === INPUT_TYPES.FREE_TEXT) {
        updated[index] = {
          question_id: Number(questionId),
          input_type: currentInputType,
          config: {
            correct_answer: question?.defaultAnswer || "Answer",
            synonyms: [],
          },
        };
      } else {
        updated[index] = {
          question_id: Number(questionId),
          input_type: currentInputType,
          config: { options: generateDefaultOptions(Number(questionId), currentInputType) },
        };
      }
    } else {
      updated[index] = {
        ...updated[index],
        question_id: null,
      };
    }

    setSelectedQuestions(updated);
    onChange(updated);
  };

  const handleInputTypeChange = (index, inputType) => {
    const updated = [...selectedQuestions];
    const questionId = updated[index].question_id;
    const question = QUESTION_BANK.find(q => q.id === questionId);

    // Pre-fill config based on input type with question-specific defaults
    if (inputType === INPUT_TYPES.MCQ || inputType === INPUT_TYPES.DROPDOWN) {
      updated[index].config = {
        options: generateDefaultOptions(questionId, inputType),
      };
    } else if (inputType === INPUT_TYPES.FREE_TEXT) {
      updated[index].config = {
        correct_answer: question?.defaultAnswer || "Answer",
        synonyms: [],
      };
    }

    updated[index].input_type = inputType;
    setSelectedQuestions(updated);
    onChange(updated);
  };

  const handleOptionChange = (qIndex, optIndex, text) => {
    const updated = [...selectedQuestions];
    updated[qIndex].config.options[optIndex].text = text;
    setSelectedQuestions(updated);
    onChange(updated);
  };

  const handleCorrectOptionChange = (qIndex, optIndex) => {
    const updated = [...selectedQuestions];
    // Set only this option as correct
    updated[qIndex].config.options.forEach((opt, i) => {
      opt.is_correct = i === optIndex;
    });
    setSelectedQuestions(updated);
    onChange(updated);
  };

  const addDropdownOption = (qIndex) => {
    const updated = [...selectedQuestions];
    if (updated[qIndex].config.options.length < 10) {
      updated[qIndex].config.options.push({ text: "", is_correct: false });
      setSelectedQuestions(updated);
      onChange(updated);
    }
  };

  const removeDropdownOption = (qIndex, optIndex) => {
    const updated = [...selectedQuestions];
    if (updated[qIndex].config.options.length > 3) {
      updated[qIndex].config.options.splice(optIndex, 1);
      setSelectedQuestions(updated);
      onChange(updated);
    }
  };

  const handleFreeTextChange = (qIndex, field, value) => {
    const updated = [...selectedQuestions];
    updated[qIndex].config[field] = value;
    setSelectedQuestions(updated);
    onChange(updated);
  };

  const handleSynonymChange = (qIndex, synIndex, value) => {
    const updated = [...selectedQuestions];
    const synonyms = [...(updated[qIndex].config.synonyms || [])];
    synonyms[synIndex] = value;
    updated[qIndex].config.synonyms = synonyms;
    setSelectedQuestions(updated);
    onChange(updated);
  };

  const addSynonym = (qIndex) => {
    const updated = [...selectedQuestions];
    const synonyms = updated[qIndex].config.synonyms || [];
    if (synonyms.length < 3) {
      updated[qIndex].config.synonyms = [...synonyms, ""];
      setSelectedQuestions(updated);
      onChange(updated);
    }
  };

  const removeSynonym = (qIndex, synIndex) => {
    const updated = [...selectedQuestions];
    const synonyms = [...(updated[qIndex].config.synonyms || [])];
    synonyms.splice(synIndex, 1);
    updated[qIndex].config.synonyms = synonyms;
    setSelectedQuestions(updated);
    onChange(updated);
  };

  // Get available questions (not already selected)
  const getAvailableQuestions = (currentIndex) => {
    const selectedIds = selectedQuestions
      .map((q, i) => i !== currentIndex ? q.question_id : null)
      .filter(id => id !== null);
    return QUESTION_BANK.filter(q => !selectedIds.includes(q.id));
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Quiz Configuration</h4>
        <p className="text-sm text-blue-800">
          We've pre-filled 5 questions with default answers to save you time. Simply review and customize them based on your campaign website.
        </p>
        <p className="text-sm text-blue-700 mt-2">
          <strong>Reward Tiers:</strong> 3/5 correct = 60% reward • 4/5 = 80% • 5/5 = 100%
        </p>
        <p className="text-xs text-blue-600 mt-2 italic">
          💡 Tip: You can keep the defaults and just update the answer options to match your website content.
        </p>
      </div>

      {selectedQuestions.map((question, qIndex) => {
        const availableQuestions = getAvailableQuestions(qIndex);
        const selectedQuestion = QUESTION_BANK.find(q => q.id === question.question_id);

        return (
          <div key={qIndex} className="border border-slate-300 rounded-lg p-4 bg-white">
            <h5 className="font-semibold text-slate-900 mb-3">Question {qIndex + 1}</h5>

            {/* Question Selector */}
            <div className="mb-4">
              <Label htmlFor={`question-${qIndex}`}>Select Question</Label>
              <select
                id={`question-${qIndex}`}
                value={question.question_id || ""}
                onChange={(e) => handleQuestionSelect(qIndex, e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="">-- Select a question --</option>
                {availableQuestions.map(q => (
                  <option key={q.id} value={q.id}>
                    Q{q.id}: {q.text}
                  </option>
                ))}
                {selectedQuestion && !availableQuestions.find(q => q.id === selectedQuestion.id) && (
                  <option value={selectedQuestion.id}>
                    Q{selectedQuestion.id}: {selectedQuestion.text}
                  </option>
                )}
              </select>
            </div>

            {question.question_id && (
              <>
                {/* Input Type Selector */}
                <div className="mb-4">
                  <Label htmlFor={`input-type-${qIndex}`}>Answer Type</Label>
                  <select
                    id={`input-type-${qIndex}`}
                    value={question.input_type}
                    onChange={(e) => handleInputTypeChange(qIndex, e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value={INPUT_TYPES.MCQ}>Multiple Choice (4 options)</option>
                    <option value={INPUT_TYPES.DROPDOWN}>Dropdown (3-10 options)</option>
                    <option value={INPUT_TYPES.FREE_TEXT}>Free Text</option>
                  </select>
                </div>

                {/* Configuration based on input type */}
                {(question.input_type === INPUT_TYPES.MCQ || question.input_type === INPUT_TYPES.DROPDOWN) && (
                  <div className="space-y-2">
                    <Label>Options (mark one as correct)</Label>
                    {question.config.options.map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${qIndex}`}
                          checked={option.is_correct}
                          onChange={() => handleCorrectOptionChange(qIndex, optIndex)}
                          className="w-4 h-4 text-teal-600"
                        />
                        <Input
                          value={option.text}
                          onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                          placeholder={`Option ${optIndex + 1}`}
                          className="flex-1"
                        />
                        {question.input_type === INPUT_TYPES.DROPDOWN && question.config.options.length > 3 && (
                          <button
                            type="button"
                            onClick={() => removeDropdownOption(qIndex, optIndex)}
                            className="text-red-600 hover:text-red-800 text-sm px-2"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    {question.input_type === INPUT_TYPES.DROPDOWN && question.config.options.length < 10 && (
                      <button
                        type="button"
                        onClick={() => addDropdownOption(qIndex)}
                        className="text-teal-600 hover:text-teal-800 text-sm font-medium"
                      >
                        + Add Option
                      </button>
                    )}
                  </div>
                )}

                {question.input_type === INPUT_TYPES.FREE_TEXT && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor={`correct-answer-${qIndex}`}>Correct Answer</Label>
                      <Input
                        id={`correct-answer-${qIndex}`}
                        value={question.config.correct_answer || ""}
                        onChange={(e) => handleFreeTextChange(qIndex, "correct_answer", e.target.value)}
                        placeholder="Enter the correct answer"
                        maxLength={120}
                      />
                    </div>
                    <div>
                      <Label>Synonyms (optional, max 3)</Label>
                      {(question.config.synonyms || []).map((syn, synIndex) => (
                        <div key={synIndex} className="flex items-center gap-2 mb-2">
                          <Input
                            value={syn}
                            onChange={(e) => handleSynonymChange(qIndex, synIndex, e.target.value)}
                            placeholder={`Synonym ${synIndex + 1}`}
                            maxLength={120}
                            className="flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => removeSynonym(qIndex, synIndex)}
                            className="text-red-600 hover:text-red-800 text-sm px-2"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      {(!question.config.synonyms || question.config.synonyms.length < 3) && (
                        <button
                          type="button"
                          onClick={() => addSynonym(qIndex)}
                          className="text-teal-600 hover:text-teal-800 text-sm font-medium"
                        >
                          + Add Synonym
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </div>
      )}
    </div>
  );
}
