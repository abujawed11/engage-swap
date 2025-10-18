CREATE DATABASE  IF NOT EXISTS `engage_swap` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `engage_swap`;
-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: engage_swap
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `campaign_analytics_daily`
--

DROP TABLE IF EXISTS `campaign_analytics_daily`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `campaign_analytics_daily` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `campaign_id` bigint NOT NULL,
  `date_ist` date NOT NULL COMMENT 'Calendar date in Asia/Kolkata (IST) timezone',
  `total_visits` int unsigned NOT NULL DEFAULT '0' COMMENT 'Total visits started',
  `completed_visits` int unsigned NOT NULL DEFAULT '0' COMMENT 'Visits that completed timer + quiz',
  `abandoned_visits` int unsigned NOT NULL DEFAULT '0' COMMENT 'Visits that were abandoned',
  `total_watch_time_sec` bigint unsigned NOT NULL DEFAULT '0' COMMENT 'Sum of all watch durations',
  `avg_watch_time_sec` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT 'Average watch time',
  `total_quiz_attempts` int unsigned NOT NULL DEFAULT '0' COMMENT 'Total quiz submissions',
  `total_correct_answers` int unsigned NOT NULL DEFAULT '0' COMMENT 'Sum of correct answers',
  `total_quiz_questions` int unsigned NOT NULL DEFAULT '0' COMMENT 'Sum of total questions (usually 5 per attempt)',
  `avg_quiz_accuracy` decimal(5,2) NOT NULL DEFAULT '0.00' COMMENT 'Average quiz accuracy percentage',
  `coins_spent` decimal(20,3) NOT NULL DEFAULT '0.000' COMMENT 'Total coins spent on payouts',
  `avg_coins_per_completion` decimal(20,3) NOT NULL DEFAULT '0.000' COMMENT 'Effective CPA',
  `visits_desktop` int unsigned NOT NULL DEFAULT '0',
  `visits_mobile` int unsigned NOT NULL DEFAULT '0',
  `visits_unknown` int unsigned NOT NULL DEFAULT '0',
  `last_computed_at` timestamp NULL DEFAULT NULL COMMENT 'When this row was last computed/updated',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_campaign_date` (`campaign_id`,`date_ist`),
  KEY `idx_campaign_id` (`campaign_id`),
  KEY `idx_date_ist` (`date_ist`),
  KEY `idx_campaign_date_range` (`campaign_id`,`date_ist`),
  CONSTRAINT `fk_analytics_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Daily aggregated analytics for campaigns (IST timezone)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary view structure for view `campaign_analytics_realtime`
--

DROP TABLE IF EXISTS `campaign_analytics_realtime`;
/*!50001 DROP VIEW IF EXISTS `campaign_analytics_realtime`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `campaign_analytics_realtime` AS SELECT 
 1 AS `campaign_id`,
 1 AS `title`,
 1 AS `owner_id`,
 1 AS `total_visits`,
 1 AS `completed_visits`,
 1 AS `completion_rate_pct`,
 1 AS `total_quiz_attempts`,
 1 AS `avg_quiz_accuracy_pct`,
 1 AS `coins_per_visit`,
 1 AS `total_clicks`,
 1 AS `clicks_served`,
 1 AS `clicks_remaining`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `campaign_enforcement_logs`
--

DROP TABLE IF EXISTS `campaign_enforcement_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `campaign_enforcement_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `campaign_id` bigint NOT NULL,
  `coins_per_visit` decimal(20,3) NOT NULL,
  `value_tier` enum('HIGH','MEDIUM','LOW') COLLATE utf8mb4_unicode_ci NOT NULL,
  `outcome` enum('ALLOW','LIMIT_REACHED','COOLDOWN_ACTIVE','ACTIVE_SESSION_EXISTS','CAMPAIGN_UNAVAILABLE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempt_count_24h` int NOT NULL DEFAULT '0',
  `seconds_since_last_attempt` int DEFAULT NULL,
  `retry_after_sec` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_campaign_id` (`campaign_id`),
  KEY `idx_outcome` (`outcome`),
  KEY `idx_value_tier` (`value_tier`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_user_campaign_date` (`user_id`,`campaign_id`,`created_at`),
  CONSTRAINT `campaign_enforcement_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `campaign_enforcement_logs_ibfk_2` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=76 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `campaign_limit_config`
--

DROP TABLE IF EXISTS `campaign_limit_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `campaign_limit_config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `config_key` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `config_value` json NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_config_key` (`config_key`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `campaign_questions`
--

DROP TABLE IF EXISTS `campaign_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `campaign_questions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `campaign_id` bigint NOT NULL,
  `question_id` int NOT NULL,
  `question_order` int NOT NULL,
  `input_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `config` json NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_campaign_question` (`campaign_id`,`question_id`),
  UNIQUE KEY `unique_campaign_order` (`campaign_id`,`question_order`),
  KEY `idx_campaign` (`campaign_id`),
  CONSTRAINT `campaign_questions_ibfk_1` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_input_type` CHECK ((`input_type` in (_cp850'dropdown',_cp850'mcq',_cp850'free_text'))),
  CONSTRAINT `chk_question_id` CHECK (((`question_id` >= 1) and (`question_id` <= 20))),
  CONSTRAINT `chk_question_order` CHECK (((`question_order` >= 1) and (`question_order` <= 5)))
) ENGINE=InnoDB AUTO_INCREMENT=306 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `campaign_rotation_tracking`
--

DROP TABLE IF EXISTS `campaign_rotation_tracking`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `campaign_rotation_tracking` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `campaign_id` bigint NOT NULL,
  `last_served_at` datetime NOT NULL,
  `serve_count` int NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_campaign_rotation` (`user_id`,`campaign_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_campaign_id` (`campaign_id`),
  KEY `idx_last_served` (`last_served_at`),
  KEY `idx_user_last_served` (`user_id`,`last_served_at`),
  CONSTRAINT `campaign_rotation_tracking_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `campaign_rotation_tracking_ibfk_2` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2253 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `campaigns`
--

DROP TABLE IF EXISTS `campaigns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `campaigns` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `public_id` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` bigint NOT NULL,
  `title` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL,
  `coins_per_visit` decimal(20,3) NOT NULL,
  `watch_duration` int NOT NULL DEFAULT '30',
  `total_clicks` int NOT NULL,
  `clicks_served` int NOT NULL DEFAULT '0',
  `is_paused` tinyint(1) NOT NULL DEFAULT '0',
  `is_finished` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `public_id` (`public_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_is_paused` (`is_paused`),
  KEY `idx_clicks_served` (`clicks_served`),
  KEY `idx_is_finished` (`is_finished`),
  CONSTRAINT `campaigns_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_coins_per_visit` CHECK ((`coins_per_visit` >= 0.001)),
  CONSTRAINT `chk_total_clicks` CHECK ((`total_clicks` >= 1)),
  CONSTRAINT `chk_watch_duration` CHECK (((`watch_duration` >= 30) and (`watch_duration` <= 120) and (((`watch_duration` - 30) % 15) = 0)))
) ENGINE=InnoDB AUTO_INCREMENT=70 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `coin_packs`
--

DROP TABLE IF EXISTS `coin_packs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coin_packs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tier_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `base_coins` decimal(20,3) NOT NULL,
  `bonus_percent` decimal(5,2) NOT NULL DEFAULT '0.00',
  `price_inr` decimal(12,2) NOT NULL,
  `price_usd` decimal(12,2) NOT NULL,
  `is_featured` tinyint(1) NOT NULL DEFAULT '0',
  `is_popular` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `display_order` int NOT NULL DEFAULT '0',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `badge_text` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_tier_name` (`tier_name`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_display_order` (`display_order`),
  KEY `idx_is_featured` (`is_featured`),
  KEY `idx_active_order` (`is_active`,`display_order`),
  CONSTRAINT `chk_pack_base_coins` CHECK ((`base_coins` > 0)),
  CONSTRAINT `chk_pack_bonus_percent` CHECK (((`bonus_percent` >= 0) and (`bonus_percent` <= 100))),
  CONSTRAINT `chk_pack_display_order` CHECK ((`display_order` >= 0)),
  CONSTRAINT `chk_pack_price_inr` CHECK ((`price_inr` > 0)),
  CONSTRAINT `chk_pack_price_usd` CHECK ((`price_usd` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `consolation_rewards`
--

DROP TABLE IF EXISTS `consolation_rewards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consolation_rewards` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `visit_token` varchar(128) NOT NULL,
  `campaign_id` bigint DEFAULT NULL,
  `user_id` bigint NOT NULL,
  `amount` decimal(20,3) NOT NULL DEFAULT '1.000',
  `reason` enum('EXHAUSTED_VISITS_CAP','EXHAUSTED_COINS','CAMPAIGN_PAUSED','CAMPAIGN_DELETED') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_visit_consolation` (`visit_token`),
  KEY `idx_user_date` (`user_id`,`created_at`),
  KEY `idx_campaign_date` (`campaign_id`,`created_at`),
  KEY `idx_visit_token` (`visit_token`),
  CONSTRAINT `consolation_rewards_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `consolation_rewards_ibfk_2` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `email_otps`
--

DROP TABLE IF EXISTS `email_otps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `email_otps` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `code_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `consumed_at` datetime DEFAULT NULL,
  `purpose` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'email_verification',
  `attempts` tinyint NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_expires_consumed` (`expires_at`,`consumed_at`),
  KEY `idx_purpose` (`purpose`),
  CONSTRAINT `email_otps_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `market_settings`
--

DROP TABLE IF EXISTS `market_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `market_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `is_checkout_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `banner_message` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `coming_soon_message` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Payments are being finalized. Coming soon!',
  `footer_note` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Prices are subject to change. All taxes included.',
  `fx_hint_usd_to_inr` decimal(12,4) DEFAULT '83.5000',
  `show_effective_price` tinyint(1) NOT NULL DEFAULT '1',
  `show_bonus_breakdown` tinyint(1) NOT NULL DEFAULT '1',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `quiz_attempts`
--

DROP TABLE IF EXISTS `quiz_attempts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quiz_attempts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `visit_token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `campaign_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `correct_count` int NOT NULL,
  `total_count` int NOT NULL DEFAULT '5',
  `passed` tinyint(1) NOT NULL,
  `multiplier` decimal(3,2) NOT NULL,
  `reward_amount` decimal(20,3) NOT NULL,
  `submitted_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `visit_token` (`visit_token`),
  KEY `idx_campaign` (`campaign_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_token` (`visit_token`),
  KEY `idx_campaign_submitted_at` (`campaign_id`,`submitted_at`),
  KEY `idx_user_submitted_at` (`user_id`,`submitted_at`),
  CONSTRAINT `quiz_attempts_ibfk_1` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE,
  CONSTRAINT `quiz_attempts_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_correct_count` CHECK (((`correct_count` >= 0) and (`correct_count` <= 5))),
  CONSTRAINT `chk_multiplier` CHECK (((`multiplier` >= 0.00) and (`multiplier` <= 1.00)))
) ENGINE=InnoDB AUTO_INCREMENT=124 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `url_validation_logs`
--

DROP TABLE IF EXISTS `url_validation_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `url_validation_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `correlation_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'UUID for tracking the validation request',
  `user_id` bigint DEFAULT NULL COMMENT 'User who submitted the URL (NULL if anonymous)',
  `url` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'The URL that was validated',
  `verdict` enum('VALID','INVALID','RETRY') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Validation outcome',
  `rejection_reason` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Rejection reason code if INVALID',
  `validation_time_ms` int unsigned DEFAULT NULL COMMENT 'Time taken to validate in milliseconds',
  `http_status_code` int DEFAULT NULL COMMENT 'HTTP status code received during probing',
  `content_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Content-Type header from the response',
  `redirect_chain` json DEFAULT NULL COMMENT 'Array of redirect URLs if followed',
  `failed_rules` json DEFAULT NULL COMMENT 'Array of rule keys that failed',
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'IP address of the requester',
  `user_agent` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'User agent string',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_correlation_id` (`correlation_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_verdict` (`verdict`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_user_verdict` (`user_id`,`verdict`),
  CONSTRAINT `fk_url_validation_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Audit log for all URL validation attempts';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `url_validator_config`
--

DROP TABLE IF EXISTS `url_validator_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `url_validator_config` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `rule_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Unique key for the validation rule',
  `enabled` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1 = enabled, 0 = disabled',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT 'Human-readable description of what this rule does',
  `metadata` json DEFAULT NULL COMMENT 'Additional configuration data for the rule',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_rule_key` (`rule_key`),
  KEY `idx_enabled` (`enabled`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Configuration table for URL validation rules';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `url_validator_rate_limits`
--

DROP TABLE IF EXISTS `url_validator_rate_limits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `url_validator_rate_limits` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `identifier` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'user_id or IP address',
  `identifier_type` enum('USER','IP') COLLATE utf8mb4_unicode_ci NOT NULL,
  `request_count` int unsigned NOT NULL DEFAULT '1',
  `window_start` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_identifier_type_window` (`identifier`,`identifier_type`,`window_start`),
  KEY `idx_window_start` (`window_start`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Rate limiting tracking for URL validator API';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_campaign_activity`
--

DROP TABLE IF EXISTS `user_campaign_activity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_campaign_activity` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `campaign_id` bigint NOT NULL,
  `attempt_count_24h` int NOT NULL DEFAULT '0',
  `last_attempt_at` datetime DEFAULT NULL,
  `last_claimed_at` datetime DEFAULT NULL,
  `active_session_token` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `active_session_started_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_campaign` (`user_id`,`campaign_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_campaign_id` (`campaign_id`),
  KEY `idx_last_attempt` (`last_attempt_at`),
  KEY `idx_active_session` (`active_session_token`),
  CONSTRAINT `user_campaign_activity_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_campaign_activity_ibfk_2` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_campaign_daily_caps`
--

DROP TABLE IF EXISTS `user_campaign_daily_caps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_campaign_daily_caps` (
  `user_id` bigint NOT NULL,
  `campaign_id` bigint NOT NULL,
  `date_key` date NOT NULL COMMENT 'Local date in Asia/Kolkata (IST) timezone',
  `attempts` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`campaign_id`,`date_key`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_campaign_id` (`campaign_id`),
  KEY `idx_date_key` (`date_key`),
  KEY `idx_user_date` (`user_id`,`date_key`),
  KEY `idx_date_key_cleanup` (`date_key`),
  CONSTRAINT `user_campaign_daily_caps_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_campaign_daily_caps_ibfk_2` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_attempts_non_negative` CHECK ((`attempts` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Daily attempt counter that resets at midnight IST (calendar-day based)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `public_id` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `username` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username_lower` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_lower` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `coins` decimal(20,3) NOT NULL DEFAULT '0.000' COMMENT 'DEPRECATED: Use wallets.available instead. Kept for backwards compatibility only.',
  `is_admin` tinyint(1) NOT NULL DEFAULT '0',
  `is_disabled` tinyint(1) NOT NULL DEFAULT '0',
  `disabled_at` datetime DEFAULT NULL,
  `disabled_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_verified_at` datetime DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username_lower` (`username_lower`),
  UNIQUE KEY `email_lower` (`email_lower`),
  UNIQUE KEY `public_id` (`public_id`),
  KEY `idx_username` (`username`),
  KEY `idx_email` (`email`),
  KEY `idx_ip_address` (`ip_address`),
  KEY `idx_is_disabled` (`is_disabled`),
  CONSTRAINT `chk_user_coins` CHECK ((`coins` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `visit_tokens`
--

DROP TABLE IF EXISTS `visit_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `visit_tokens` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint NOT NULL,
  `campaign_id` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` datetime NOT NULL,
  `consumed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `idx_token` (`token`),
  KEY `idx_expires` (`expires_at`),
  KEY `idx_user_campaign` (`user_id`,`campaign_id`),
  KEY `visit_tokens_ibfk_2` (`campaign_id`),
  CONSTRAINT `visit_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `visit_tokens_ibfk_2` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=190 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `visits`
--

DROP TABLE IF EXISTS `visits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `visits` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `public_id` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `visit_token` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` bigint NOT NULL,
  `campaign_id` bigint NOT NULL,
  `campaign_owner_id` bigint NOT NULL,
  `coins_earned` decimal(20,3) NOT NULL,
  `is_consolation` tinyint(1) DEFAULT '0',
  `visited_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `visit_date` date NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `public_id` (`public_id`),
  KEY `campaign_owner_id` (`campaign_owner_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_campaign` (`campaign_id`),
  KEY `idx_campaign_date` (`campaign_id`,`visit_date`),
  KEY `idx_visit_token` (`visit_token`),
  KEY `idx_visits_consolation` (`is_consolation`,`user_id`,`visit_date`),
  KEY `idx_campaign_visited_at` (`campaign_id`,`visited_at`),
  KEY `idx_user_visited_at` (`user_id`,`visited_at`),
  CONSTRAINT `visits_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `visits_ibfk_2` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE,
  CONSTRAINT `visits_ibfk_3` FOREIGN KEY (`campaign_owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=109 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wallet_audit_logs`
--

DROP TABLE IF EXISTS `wallet_audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wallet_audit_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `actor_type` enum('SYSTEM','ADMIN') COLLATE utf8mb4_unicode_ci NOT NULL,
  `actor_id` bigint DEFAULT NULL,
  `user_id` bigint NOT NULL,
  `action` enum('CREATE_TXN','REVERSE_TXN','ADJUST_BALANCE','RECALC_AGGREGATES','CREATE_WALLET','LOCK_FUNDS','UNLOCK_FUNDS') COLLATE utf8mb4_unicode_ci NOT NULL,
  `txn_id` bigint DEFAULT NULL,
  `amount` decimal(20,3) DEFAULT NULL,
  `reason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_user_id` (`user_id`),
  KEY `idx_audit_actor_type` (`actor_type`),
  KEY `idx_audit_actor_id` (`actor_id`),
  KEY `idx_audit_action` (`action`),
  KEY `idx_audit_txn_id` (`txn_id`),
  KEY `idx_audit_created_at` (`created_at`),
  KEY `idx_audit_user_created` (`user_id`,`created_at` DESC),
  CONSTRAINT `wallet_audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `wallet_audit_logs_ibfk_2` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `wallet_audit_logs_ibfk_3` FOREIGN KEY (`txn_id`) REFERENCES `wallet_transactions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=76 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wallet_transactions`
--

DROP TABLE IF EXISTS `wallet_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wallet_transactions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `type` enum('EARNED','SPENT','BONUS','REFUND','ADMIN_CREDIT','ADMIN_DEBIT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('SUCCESS','PENDING','FAILED','REVERSED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SUCCESS',
  `amount` decimal(20,3) NOT NULL,
  `sign` enum('PLUS','MINUS') COLLATE utf8mb4_unicode_ci NOT NULL,
  `balance_after` decimal(20,3) DEFAULT NULL,
  `campaign_id` bigint DEFAULT NULL,
  `source` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_reference_id` (`reference_id`),
  KEY `idx_txn_user_id` (`user_id`),
  KEY `idx_txn_type` (`type`),
  KEY `idx_txn_status` (`status`),
  KEY `idx_txn_campaign_id` (`campaign_id`),
  KEY `idx_txn_created_at` (`created_at`),
  KEY `idx_txn_source` (`source`),
  KEY `idx_txn_user_created` (`user_id`,`created_at` DESC),
  KEY `idx_txn_user_type` (`user_id`,`type`),
  KEY `idx_txn_user_status` (`user_id`,`status`),
  KEY `idx_txn_balance_after` (`balance_after`),
  KEY `idx_campaign_created_at` (`campaign_id`,`created_at`),
  KEY `idx_source_created_at` (`source`,`created_at`),
  CONSTRAINT `wallet_transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `wallet_transactions_ibfk_2` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_txn_amount` CHECK ((`amount` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=69 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wallets`
--

DROP TABLE IF EXISTS `wallets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wallets` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `available` decimal(20,3) NOT NULL DEFAULT '0.000',
  `locked` decimal(20,3) NOT NULL DEFAULT '0.000',
  `lifetime_earned` decimal(20,3) NOT NULL DEFAULT '0.000',
  `lifetime_spent` decimal(20,3) NOT NULL DEFAULT '0.000',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_wallet` (`user_id`),
  KEY `idx_wallets_user_id` (`user_id`),
  KEY `idx_wallets_updated_at` (`updated_at`),
  CONSTRAINT `wallets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_wallet_available` CHECK ((`available` >= 0)),
  CONSTRAINT `chk_wallet_lifetime_earned` CHECK ((`lifetime_earned` >= 0)),
  CONSTRAINT `chk_wallet_lifetime_spent` CHECK ((`lifetime_spent` >= 0)),
  CONSTRAINT `chk_wallet_locked` CHECK ((`locked` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Final view structure for view `campaign_analytics_realtime`
--

/*!50001 DROP VIEW IF EXISTS `campaign_analytics_realtime`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`engage_user`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `campaign_analytics_realtime` AS select `c`.`id` AS `campaign_id`,`c`.`title` AS `title`,`c`.`user_id` AS `owner_id`,count(distinct `v`.`id`) AS `total_visits`,sum((case when (`qa`.`passed` = 1) then 1 else 0 end)) AS `completed_visits`,(case when (count(distinct `v`.`id`) > 0) then round(((sum((case when (`qa`.`passed` = 1) then 1 else 0 end)) / count(distinct `v`.`id`)) * 100),2) else 0.00 end) AS `completion_rate_pct`,count(`qa`.`id`) AS `total_quiz_attempts`,(case when (count(`qa`.`id`) > 0) then round(avg(((`qa`.`correct_count` / `qa`.`total_count`) * 100)),2) else 0.00 end) AS `avg_quiz_accuracy_pct`,`c`.`coins_per_visit` AS `coins_per_visit`,`c`.`total_clicks` AS `total_clicks`,`c`.`clicks_served` AS `clicks_served`,(`c`.`total_clicks` - `c`.`clicks_served`) AS `clicks_remaining` from ((`campaigns` `c` left join `visits` `v` on((`c`.`id` = `v`.`campaign_id`))) left join `quiz_attempts` `qa` on((`v`.`visit_token` = `qa`.`visit_token`))) group by `c`.`id`,`c`.`title`,`c`.`user_id`,`c`.`coins_per_visit`,`c`.`total_clicks`,`c`.`clicks_served` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-18 17:27:43
