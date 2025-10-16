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
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=246 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
  `attempts` tinyint NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_expires_consumed` (`expires_at`,`consumed_at`),
  CONSTRAINT `email_otps_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
  CONSTRAINT `quiz_attempts_ibfk_1` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE,
  CONSTRAINT `quiz_attempts_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_correct_count` CHECK (((`correct_count` >= 0) and (`correct_count` <= 5))),
  CONSTRAINT `chk_multiplier` CHECK (((`multiplier` >= 0.00) and (`multiplier` <= 1.00)))
) ENGINE=InnoDB AUTO_INCREMENT=76 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
  `coins` decimal(20,3) NOT NULL DEFAULT '0.000',
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
) ENGINE=InnoDB AUTO_INCREMENT=128 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
  CONSTRAINT `visits_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `visits_ibfk_2` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE,
  CONSTRAINT `visits_ibfk_3` FOREIGN KEY (`campaign_owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=69 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-16 17:04:43
