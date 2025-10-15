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
const { checkConsolationEligibility, issueConsolationReward, CONSOLATION_CONFIG } = require('../utils/consolationRewards');

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
    const visitToken = req.query.visit_token; // Pass visit_token for consolation tracking

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Fetch campaign with lock to check state (ACTIVE, PAUSED, DELETED)
      const [campaigns] = await connection.query(
        'SELECT id, user_id, coins_per_visit, watch_duration, total_clicks, is_paused, is_finished FROM campaigns WHERE id = ? FOR UPDATE',
        [campaignId]
      );

      // CHECKPOINT 1: Campaign DELETED (not found in DB)
      if (campaigns.length === 0) {
        console.log('[Quiz GET] Campaign deleted during timer:', { campaignId, userId, visitToken });

        // Check if user is eligible for consolation
        if (visitToken) {
          console.log('[Quiz GET] Checking consolation eligibility...');
          const eligibility = await checkConsolationEligibility(connection, userId, campaignId, visitToken, CONSOLATION_CONFIG.REASON.CAMPAIGN_DELETED);
          console.log('[Quiz GET] Consolation eligibility:', eligibility);

          if (eligibility.eligible) {
            console.log('[Quiz GET] Issuing consolation reward...');
            const consolation = await issueConsolationReward(
              connection,
              userId,
              campaignId,
              visitToken,
              CONSOLATION_CONFIG.REASON.CAMPAIGN_DELETED
            );

            await connection.commit();
            connection.release();

            return res.status(200).json({
              outcome: 'CONSOLATION_INTERRUPTED',
              reason: 'DELETED',
              coins: consolation.amount,
              new_balance: consolation.newBalance,
              message: 'Campaign was deleted while you were completing the task. We added a goodwill reward of 1.0 coin.'
            });
          } else {
            console.log('[Quiz GET] Not eligible for consolation:', eligibility.reason);
          }
        } else {
          console.log('[Quiz GET] No visit token provided, cannot issue consolation');
        }

        await connection.rollback();
        connection.release();
        return res.status(404).json({ error: 'Campaign not found' });
      }

      const campaign = campaigns[0];

      // CHECKPOINT 2: Campaign PAUSED
      if (campaign.is_paused) {
        console.log('[Quiz GET] Campaign paused during timer:', { campaignId, userId });

        // Check if user is eligible for consolation
        if (visitToken) {
          const eligibility = await checkConsolationEligibility(connection, userId, campaignId, visitToken, CONSOLATION_CONFIG.REASON.CAMPAIGN_PAUSED);

          if (eligibility.eligible) {
            const consolation = await issueConsolationReward(
              connection,
              userId,
              campaignId,
              visitToken,
              CONSOLATION_CONFIG.REASON.CAMPAIGN_PAUSED
            );

            await connection.commit();
            connection.release();

            return res.status(200).json({
              outcome: 'CONSOLATION_INTERRUPTED',
              reason: 'PAUSED',
              coins: consolation.amount,
              new_balance: consolation.newBalance,
              message: 'Campaign was paused while you were completing the task. We added a goodwill reward of 1.0 coin.'
            });
          }
        }

        await connection.rollback();
        connection.release();
        return res.status(403).json({ error: 'Campaign is paused' });
      }

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

      await connection.commit();

      res.status(200).json({
        campaign_id: campaignId,
        full_reward: roundCoins(actualCoinsPerVisit),
        questions: randomizedQuestions,
      });
    } catch (error) {
      await connection.rollback();
      throw error;
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

      // Fetch visit token to validate and get campaign info with campaign state
      const [tokens] = await connection.query(
        `SELECT vt.campaign_id, vt.user_id, c.coins_per_visit, c.watch_duration, c.total_clicks, c.is_paused, c.is_finished
         FROM visit_tokens vt
         LEFT JOIN campaigns c ON vt.campaign_id = c.id
         WHERE vt.token = ? FOR UPDATE`,
        [visit_token]
      );

      if (tokens.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ error: 'Visit token not found' });
      }

      const tokenData = tokens[0];

      if (tokenData.user_id !== userId) {
        await connection.rollback();
        connection.release();
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // CHECKPOINT: Campaign DELETED (campaign_id is NULL or LEFT JOIN returned null)
      if (!tokenData.campaign_id || !tokenData.coins_per_visit) {
        console.log('[Quiz Submit] Campaign deleted during quiz:', { campaignId: tokenData.campaign_id, userId });

        const eligibility = await checkConsolationEligibility(connection, userId, tokenData.campaign_id, visit_token, CONSOLATION_CONFIG.REASON.CAMPAIGN_DELETED);
        console.log('[Quiz Submit] Consolation eligibility:', eligibility);

        if (eligibility.eligible) {
          const consolation = await issueConsolationReward(
            connection,
            userId,
            tokenData.campaign_id,
            visit_token,
            CONSOLATION_CONFIG.REASON.CAMPAIGN_DELETED
          );

          await connection.commit();
          connection.release();

          return res.status(200).json({
            outcome: 'CONSOLATION_INTERRUPTED',
            reason: 'DELETED',
            coins: consolation.amount,
            new_balance: consolation.newBalance,
            message: 'Campaign was deleted during your quiz attempt. We added a goodwill reward of 1.0 coin.'
          });
        }

        // Not eligible for consolation - explain why
        console.log('[Quiz Submit] Not eligible for consolation:', eligibility.reason);
        await connection.rollback();
        connection.release();
        return res.status(404).json({
          error: 'Campaign no longer exists',
          consolation_ineligible: true,
          reason: eligibility.reason || 'Consolation limits exceeded'
        });
      }

      // CHECKPOINT: Campaign PAUSED
      if (tokenData.is_paused) {
        console.log('[Quiz Submit] Campaign paused during quiz:', { campaignId: tokenData.campaign_id, userId });

        const eligibility = await checkConsolationEligibility(connection, userId, tokenData.campaign_id, visit_token, CONSOLATION_CONFIG.REASON.CAMPAIGN_PAUSED);

        if (eligibility.eligible) {
          const consolation = await issueConsolationReward(
            connection,
            userId,
            tokenData.campaign_id,
            visit_token,
            CONSOLATION_CONFIG.REASON.CAMPAIGN_PAUSED
          );

          await connection.commit();
          connection.release();

          return res.status(200).json({
            outcome: 'CONSOLATION_INTERRUPTED',
            reason: 'PAUSED',
            coins: consolation.amount,
            new_balance: consolation.newBalance,
            message: 'Campaign was paused during your quiz attempt. We added a goodwill reward of 1.0 coin.'
          });
        }

        await connection.rollback();
        connection.release();
        return res.status(403).json({ error: 'Campaign is paused' });
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
