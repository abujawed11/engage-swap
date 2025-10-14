/**
 * Standard Question Bank
 * 20 site-agnostic questions that campaigners can choose from
 */

const QUESTION_BANK = [
  {
    id: 1,
    text: "What is the primary color used in the website's logo?",
    category: "visual",
  },
  {
    id: 2,
    text: "What is the main product or service offered?",
    category: "content",
  },
  {
    id: 3,
    text: "What is the company or website name?",
    category: "content",
  },
  {
    id: 4,
    text: "What is the tagline or slogan displayed on the homepage?",
    category: "content",
  },
  {
    id: 5,
    text: "How many main navigation menu items are there?",
    category: "visual",
  },
  {
    id: 6,
    text: "What is the call-to-action text on the main button?",
    category: "content",
  },
  {
    id: 7,
    text: "What email address or contact method is displayed?",
    category: "content",
  },
  {
    id: 8,
    text: "What year was the company founded (if mentioned)?",
    category: "content",
  },
  {
    id: 9,
    text: "What social media platform is linked first?",
    category: "content",
  },
  {
    id: 10,
    text: "What is the first benefit or feature mentioned?",
    category: "content",
  },
  {
    id: 11,
    text: "What is the background color of the header?",
    category: "visual",
  },
  {
    id: 12,
    text: "What type of pricing model is offered?",
    category: "content",
  },
  {
    id: 13,
    text: "What is mentioned in the hero section headline?",
    category: "content",
  },
  {
    id: 14,
    text: "How many testimonials or reviews are visible?",
    category: "visual",
  },
  {
    id: 15,
    text: "What is the footer copyright text?",
    category: "content",
  },
  {
    id: 16,
    text: "What industry or sector does the website serve?",
    category: "content",
  },
  {
    id: 17,
    text: "What is the first word in the main headline?",
    category: "content",
  },
  {
    id: 18,
    text: "What icon or image is used in the hero section?",
    category: "visual",
  },
  {
    id: 19,
    text: "What customer support option is available?",
    category: "content",
  },
  {
    id: 20,
    text: "What location or region is mentioned?",
    category: "content",
  },
];

/**
 * Input types for questions
 */
const INPUT_TYPES = {
  DROPDOWN: "dropdown",
  MCQ: "mcq",
  FREE_TEXT: "free_text",
};

/**
 * Get a question by ID
 */
function getQuestionById(id) {
  return QUESTION_BANK.find((q) => q.id === id);
}

/**
 * Get all questions
 */
function getAllQuestions() {
  return [...QUESTION_BANK];
}

/**
 * Validate question IDs
 */
function validateQuestionIds(questionIds) {
  if (!Array.isArray(questionIds)) {
    return "Question IDs must be an array";
  }

  if (questionIds.length !== 5) {
    return "Exactly 5 questions must be selected";
  }

  const unique = new Set(questionIds);
  if (unique.size !== 5) {
    return "Questions must be distinct";
  }

  for (const id of questionIds) {
    if (!getQuestionById(id)) {
      return `Invalid question ID: ${id}`;
    }
  }

  return null;
}

module.exports = {
  QUESTION_BANK,
  INPUT_TYPES,
  getQuestionById,
  getAllQuestions,
  validateQuestionIds,
};
