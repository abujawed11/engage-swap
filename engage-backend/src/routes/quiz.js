/**
 * Quiz Routes
 * Server-side question delivery and grading
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const { getQuestionById } = require('../utils/questionBank');
const { checkFreeTextAnswer } = require('../utils/questionValidation');
const { calculateQuizReward } = require('../utils/quizRewards');
const { roundCoins, calculateActualCoinsPerVisit } = require('../utils/validation');

/**
 * Fisher-Yates shuffle for randomization
 */
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * GET /quiz/:campaignId
 * Fetch randomized quiz questions for a campaign
 * Returns questions with randomized order and randomized options
 * Does NOT include correct answers
 */
router.get('/:campaignId', async (req, res, next) => {
  try {
    const campaignId = req.params.campaignId;
    const userId = req.user.id;

    const connection = await db.getConnection();

    try {
      // Fetch campaign to verify it exists and get owner
      const [campaigns] = await connection.query(
        'SELECT id, user_id, coins_per_visit, watch_duration, total_clicks FROM campaigns WHERE id = ? AND is_paused = 0',
        [campaignId]
      );

      if (campaigns.length === 0) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      const campaign = campaigns[0];

      // Users cannot take quiz on their own campaigns
      if (campaign.user_id === userId) {
        return res.status(403).json({ error: 'Cannot take quiz on your own campaign' });
      }

      // Calculate actual coins per visit (includes duration bonus)
      const actualCoinsPerVisit = calculateActualCoinsPerVisit(
        campaign.coins_per_visit,
        campaign.watch_duration,
        campaign.total_clicks
      );

      // Fetch campaign questions
      const [rows] = await connection.query(
        `SELECT question_id, question_order, input_type, config
         FROM campaign_questions
         WHERE campaign_id = ?
         ORDER BY question_order ASC`,
        [campaignId]
      );

      if (rows.length !== 5) {
        return res.status(500).json({ error: 'Campaign does not have 5 questions configured' });
      }

      // Build question array with randomization
      const questions = rows.map((row) => {
        const questionData = getQuestionById(row.question_id);
        if (!questionData) {
          throw new Error(`Question ${row.question_id} not found in bank`);
        }

        const config = typeof row.config === 'string' ? JSON.parse(row.config) : row.config;

        // Prepare question object
        const question = {
          question_id: row.question_id,
          question_order: row.question_order,
          text: questionData.text,
          input_type: row.input_type,
        };

        // Randomize options for dropdown and mcq
        if (row.input_type === 'dropdown' || row.input_type === 'mcq') {
          const options = config.options.map((opt) => ({
            text: opt.text,
            // DO NOT include is_correct
          }));
          question.options = shuffle(options);
        }

        // For free_text, no config needed on client
        return question;
      });

      // Randomize question order
      const randomizedQuestions = shuffle(questions);

      res.status(200).json({
        campaign_id: campaignId,
        full_reward: roundCoins(actualCoinsPerVisit),
        questions: randomizedQuestions,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching quiz:', error);
    next(error);
  }
});

/**
 * POST /quiz/submit
 * Grade quiz and store result
 * Request body: { visit_token, answers: [{question_id, answer}] }
 * Returns: { passed, correct_count, reward_amount }
 * Idempotent: returns cached result if already graded
 */
router.post('/submit', async (req, res, next) => {
  try {
    const { visit_token, answers } = req.body;
    const userId = req.user.id;

    if (!visit_token || typeof visit_token !== 'string') {
      return res.status(400).json({ error: 'visit_token is required' });
    }

    if (!Array.isArray(answers) || answers.length !== 5) {
      return res.status(400).json({ error: 'Exactly 5 answers required' });
    }

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Check if already graded (idempotency)
      const [existing] = await connection.query(
        'SELECT correct_count, passed, multiplier, reward_amount FROM quiz_attempts WHERE visit_token = ?',
        [visit_token]
      );

      if (existing.length > 0) {
        await connection.commit();
        return res.status(200).json({
          passed: Boolean(existing[0].passed),
          correct_count: existing[0].correct_count,
          multiplier: parseFloat(existing[0].multiplier),
          reward_amount: parseFloat(existing[0].reward_amount),
        });
      }

      // Fetch visit token to validate and get campaign info
      const [tokens] = await connection.query(
        `SELECT vt.campaign_id, vt.user_id, c.coins_per_visit, c.watch_duration, c.total_clicks
         FROM visit_tokens vt
         JOIN campaigns c ON vt.campaign_id = c.id
         WHERE vt.token = ?`,
        [visit_token]
      );

      if (tokens.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Visit token not found' });
      }

      const tokenData = tokens[0];

      if (tokenData.user_id !== userId) {
        await connection.rollback();
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Calculate actual coins per visit (includes duration bonus)
      const actualCoinsPerVisit = calculateActualCoinsPerVisit(
        tokenData.coins_per_visit,
        tokenData.watch_duration,
        tokenData.total_clicks
      );

      console.log('[Quiz Submit] Campaign details:', {
        baseCoins: tokenData.coins_per_visit,
        watchDuration: tokenData.watch_duration,
        totalClicks: tokenData.total_clicks,
        actualCoinsPerVisit: actualCoinsPerVisit
      });

      // Fetch campaign questions with correct answers
      const [questions] = await connection.query(
        `SELECT question_id, input_type, config
         FROM campaign_questions
         WHERE campaign_id = ?`,
        [tokenData.campaign_id]
      );

      if (questions.length !== 5) {
        await connection.rollback();
        return res.status(500).json({ error: 'Campaign does not have 5 questions' });
      }

      // Grade each answer
      let correctCount = 0;

      for (const answer of answers) {
        const { question_id, answer: userAnswer } = answer;

        // Find the question config
        const questionConfig = questions.find((q) => q.question_id === question_id);
        if (!questionConfig) {
          continue; // Invalid question_id, count as wrong
        }

        const config = typeof questionConfig.config === 'string'
          ? JSON.parse(questionConfig.config)
          : questionConfig.config;

        // Grade based on input type
        if (questionConfig.input_type === 'dropdown' || questionConfig.input_type === 'mcq') {
          // Find correct option
          const correctOption = config.options.find((opt) => opt.is_correct);
          if (correctOption && userAnswer === correctOption.text) {
            correctCount++;
          }
        } else if (questionConfig.input_type === 'free_text') {
          // Check with normalization
          if (checkFreeTextAnswer(userAnswer, config.correct_answer, config.synonyms || [])) {
            correctCount++;
          }
        }
      }

      // Calculate reward using actual coins per visit (includes duration bonus)
      const fullReward = roundCoins(actualCoinsPerVisit);
      const { passed, multiplier, reward } = calculateQuizReward(fullReward, correctCount);

      console.log('[Quiz Submit] Reward calculation:', {
        fullReward: fullReward,
        correctCount: correctCount,
        passed: passed,
        multiplier: multiplier,
        finalReward: reward
      });

      // Store result
      await connection.query(
        `INSERT INTO quiz_attempts
         (visit_token, campaign_id, user_id, correct_count, total_count, passed, multiplier, reward_amount)
         VALUES (?, ?, ?, ?, 5, ?, ?, ?)`,
        [visit_token, tokenData.campaign_id, userId, correctCount, passed ? 1 : 0, multiplier, reward]
      );

      await connection.commit();

      res.status(200).json({
        passed,
        correct_count: correctCount,
        multiplier,
        reward_amount: reward,
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error grading quiz:', error);
    next(error);
  }
});

module.exports = router;
