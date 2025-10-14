/**
 * Question Configuration Validation
 * Validates dropdown, MCQ, and free-text question configurations
 */

const { INPUT_TYPES } = require('./questionBank');

/**
 * Normalize text for comparison
 * - Trim leading/trailing whitespace
 * - Collapse internal spaces to single space
 * - Convert to lowercase
 */
function normalizeText(text) {
  if (typeof text !== 'string') return '';
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/**
 * Validate dropdown configuration
 * - 3 to 10 options required
 * - Exactly 1 marked correct
 * - No duplicate options (case-insensitive)
 */
function validateDropdownConfig(config) {
  if (!config.options || !Array.isArray(config.options)) {
    return 'Dropdown requires an options array';
  }

  if (config.options.length < 3) {
    return 'Dropdown must have at least 3 options';
  }

  if (config.options.length > 10) {
    return 'Dropdown cannot have more than 10 options';
  }

  const normalized = new Set();
  let correctCount = 0;
  let correctIndex = -1;

  for (let i = 0; i < config.options.length; i++) {
    const opt = config.options[i];

    if (!opt.text || typeof opt.text !== 'string') {
      return `Option ${i + 1} must have text`;
    }

    const trimmed = opt.text.trim();
    if (trimmed.length === 0) {
      return `Option ${i + 1} cannot be empty`;
    }

    const norm = normalizeText(opt.text);
    if (normalized.has(norm)) {
      return `Duplicate option: "${opt.text}"`;
    }
    normalized.add(norm);

    if (opt.is_correct) {
      correctCount++;
      correctIndex = i;
    }
  }

  if (correctCount !== 1) {
    return 'Exactly one option must be marked correct';
  }

  return { valid: true, correctIndex };
}

/**
 * Validate MCQ-4 configuration
 * - Exactly 4 options required
 * - Exactly 1 marked correct
 * - No duplicate options (case-insensitive)
 */
function validateMcqConfig(config) {
  if (!config.options || !Array.isArray(config.options)) {
    return 'MCQ requires an options array';
  }

  if (config.options.length !== 4) {
    return 'MCQ must have exactly 4 options';
  }

  const normalized = new Set();
  let correctCount = 0;
  let correctIndex = -1;

  for (let i = 0; i < config.options.length; i++) {
    const opt = config.options[i];

    if (!opt.text || typeof opt.text !== 'string') {
      return `Option ${i + 1} must have text`;
    }

    const trimmed = opt.text.trim();
    if (trimmed.length === 0) {
      return `Option ${i + 1} cannot be empty`;
    }

    const norm = normalizeText(opt.text);
    if (normalized.has(norm)) {
      return `Duplicate option: "${opt.text}"`;
    }
    normalized.add(norm);

    if (opt.is_correct) {
      correctCount++;
      correctIndex = i;
    }
  }

  if (correctCount !== 1) {
    return 'Exactly one option must be marked correct';
  }

  return { valid: true, correctIndex };
}

/**
 * Validate free-text configuration
 * - Canonical answer required (1-120 chars after trim)
 * - Optional synonyms (max 3, 1-120 chars each)
 * - No duplicates among canonical + synonyms (case-insensitive)
 */
function validateFreeTextConfig(config) {
  if (!config.correct_answer || typeof config.correct_answer !== 'string') {
    return 'Free-text requires a correct_answer';
  }

  const trimmed = config.correct_answer.trim();
  if (trimmed.length === 0) {
    return 'Correct answer cannot be empty';
  }

  if (trimmed.length > 120) {
    return 'Correct answer cannot exceed 120 characters';
  }

  const normalized = new Set([normalizeText(config.correct_answer)]);
  const synonyms = config.synonyms || [];

  if (!Array.isArray(synonyms)) {
    return 'Synonyms must be an array';
  }

  if (synonyms.length > 3) {
    return 'Maximum 3 synonyms allowed';
  }

  for (let i = 0; i < synonyms.length; i++) {
    const syn = synonyms[i];

    if (!syn || typeof syn !== 'string') {
      return `Synonym ${i + 1} must be a string`;
    }

    const trimmedSyn = syn.trim();
    if (trimmedSyn.length === 0) {
      return `Synonym ${i + 1} cannot be empty`;
    }

    if (trimmedSyn.length > 120) {
      return `Synonym ${i + 1} cannot exceed 120 characters`;
    }

    const norm = normalizeText(syn);
    if (normalized.has(norm)) {
      return `Duplicate answer/synonym: "${syn}"`;
    }
    normalized.add(norm);
  }

  return { valid: true };
}

/**
 * Validate a single question configuration
 */
function validateQuestionConfig(question) {
  const { question_id, input_type, config } = question;

  if (!question_id || typeof question_id !== 'number') {
    return 'question_id is required';
  }

  if (!input_type || !Object.values(INPUT_TYPES).includes(input_type)) {
    return `Invalid input_type. Must be one of: ${Object.values(INPUT_TYPES).join(', ')}`;
  }

  if (!config || typeof config !== 'object') {
    return 'config is required';
  }

  switch (input_type) {
    case INPUT_TYPES.DROPDOWN:
      return validateDropdownConfig(config);

    case INPUT_TYPES.MCQ:
      return validateMcqConfig(config);

    case INPUT_TYPES.FREE_TEXT:
      return validateFreeTextConfig(config);

    default:
      return 'Unknown input type';
  }
}

/**
 * Validate complete campaign question set
 * - Exactly 5 questions
 * - All valid configurations
 */
function validateCampaignQuestions(questions) {
  if (!Array.isArray(questions)) {
    return 'Questions must be an array';
  }

  if (questions.length !== 5) {
    return 'Exactly 5 questions required';
  }

  const questionIds = new Set();

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];

    if (questionIds.has(q.question_id)) {
      return `Duplicate question ID: ${q.question_id}`;
    }
    questionIds.add(q.question_id);

    const validation = validateQuestionConfig(q);
    if (validation !== true && !validation.valid) {
      return `Question ${i + 1}: ${validation}`;
    }
  }

  return null; // All valid
}

/**
 * Check if a user's answer matches the correct answer(s)
 * For free-text questions with normalization
 */
function checkFreeTextAnswer(userAnswer, correctAnswer, synonyms = []) {
  const normalizedUser = normalizeText(userAnswer);
  const normalizedCorrect = normalizeText(correctAnswer);

  if (normalizedUser === normalizedCorrect) {
    return true;
  }

  for (const syn of synonyms) {
    if (normalizedUser === normalizeText(syn)) {
      return true;
    }
  }

  return false;
}

module.exports = {
  normalizeText,
  validateDropdownConfig,
  validateMcqConfig,
  validateFreeTextConfig,
  validateQuestionConfig,
  validateCampaignQuestions,
  checkFreeTextAnswer,
};
