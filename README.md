
```
engage-swap
├─ engage-backend
├─ engage-frontend
│  ├─ eslint.config.js
│  ├─ index.html
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ public
│  │  └─ vite.svg
│  ├─ README.md
│  ├─ src
│  │  ├─ App.css
│  │  ├─ App.jsx
│  │  ├─ assets
│  │  │  └─ react.svg
│  │  ├─ index.css
│  │  └─ main.jsx
│  └─ vite.config.js
└─ README.md

```
```
engage-swap
├─ .claude
│  └─ settings.local.json
├─ ADMIN_PANEL_README.md
├─ CAMPAIGN_LIMITS_IMPLEMENTATION.md
├─ engage-backend
│  ├─ .env
│  ├─ .env.example
│  ├─ db
│  │  ├─ create_admin.sql
│  │  └─ Dump20251015.sql
│  ├─ MIDNIGHT_RESET_IMPLEMENTATION.md
│  ├─ migrations
│  │  ├─ 000_drop_all_tables.sql
│  │  ├─ 001_create_users_table.sql
│  │  ├─ 001_create_users_table_simple.sql
│  │  ├─ 001_create_users_table_v2.sql
│  │  ├─ 002_add_email_verification.sql
│  │  ├─ 003_create_campaigns_table.sql
│  │  ├─ 003_create_campaigns_table_simple.sql
│  │  ├─ 003_create_campaigns_table_v2.sql
│  │  ├─ 004_create_visits_and_tokens.sql
│  │  ├─ 004_create_visits_and_tokens_simple.sql
│  │  ├─ 004_create_visits_and_tokens_v2.sql
│  │  ├─ 005_add_public_id_users.sql
│  │  ├─ 005_add_public_id_users_v2.sql
│  │  ├─ 006_add_public_id_campaigns.sql
│  │  ├─ 007_add_public_id_visits.sql
│  │  ├─ 008_add_coins_check_constraint.sql
│  │  ├─ 009_update_campaigns_for_total_clicks.sql
│  │  ├─ 010_add_watch_duration_and_decimal_coins.sql
│  │  ├─ 011_add_campaign_questions.sql
│  │  ├─ 012_add_consolation_rewards.sql
│  │  ├─ 012_add_visit_token_to_visits.sql
│  │  ├─ 013_add_campaign_finished_status.sql
│  │  ├─ 014_add_consolation_paused_deleted_reasons.sql
│  │  ├─ 015_make_consolation_campaign_id_nullable.sql
│  │  ├─ 016_update_visit_tokens_campaign_fk.sql
│  │  ├─ 017_add_user_campaign_activity.sql
│  │  ├─ 018_add_campaign_rotation_tracking.sql
│  │  ├─ 019_add_campaign_enforcement_logs.sql
│  │  ├─ 020_add_campaign_limit_config.sql
│  │  ├─ 021_add_user_ip_and_updated_at.sql
│  │  ├─ 022_add_user_is_disabled.sql
│  │  ├─ 023_add_scoring_config.sql
│  │  ├─ 024_add_user_campaign_daily_caps.sql
│  │  ├─ 025_deprecate_users_coins_field.sql
│  │  ├─ 026_add_url_validator_system.sql
│  │  ├─ 027_add_campaign_analytics_system.sql
│  │  ├─ 028_add_soft_delete_to_campaigns.sql
│  │  ├─ 029_add_snapshot_fields_to_visits.sql
│  │  ├─ 030_add_snapshot_fields_to_wallet_transactions.sql
│  │  ├─ 031_add_updated_at_to_campaigns.sql
│  │  ├─ 032_create_pending_users_table.sql
│  │  ├─ add_balance_after_to_transactions.sql
│  │  ├─ add_otp_purpose.sql
│  │  ├─ cleanup_for_public_id.sql
│  │  ├─ coin_market_system.sql
│  │  └─ wallet_system.sql
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ README.md
│  ├─ scripts
│  │  └─ seedAdmin.js
│  ├─ server.js
│  ├─ src
│  │  ├─ config.js
│  │  ├─ db.js
│  │  ├─ middleware
│  │  │  ├─ adminAuth.js
│  │  │  ├─ authRequired.js
│  │  │  ├─ errorHandler.js
│  │  │  ├─ rateLimiter.js
│  │  │  ├─ requestLogger.js
│  │  │  └─ validatorRateLimit.js
│  │  ├─ routes
│  │  │  ├─ admin.js
│  │  │  ├─ analytics.js
│  │  │  ├─ auth.js
│  │  │  ├─ campaigns.js
│  │  │  ├─ earn.js
│  │  │  ├─ health.js
│  │  │  ├─ market.js
│  │  │  ├─ quiz.js
│  │  │  ├─ user.js
│  │  │  ├─ validator.js
│  │  │  └─ wallet.js
│  │  ├─ services
│  │  │  └─ campaignAnalytics.js
│  │  └─ utils
│  │     ├─ analytics.js
│  │     ├─ campaignLimits.js
│  │     ├─ campaignScoring.js
│  │     ├─ consolationConfig.js
│  │     ├─ consolationRewards.js
│  │     ├─ ipAddress.js
│  │     ├─ jwt.js
│  │     ├─ mailer.js
│  │     ├─ otp.js
│  │     ├─ publicId.js
│  │     ├─ questionBank.js
│  │     ├─ questionValidation.js
│  │     ├─ quizRewards.js
│  │     ├─ quizRewardWallet.js
│  │     ├─ timezone.js
│  │     ├─ urlValidator.js
│  │     ├─ validation.js
│  │     ├─ visitToken.js
│  │     └─ wallet.js
│  ├─ tests
│  │  └─ timezone.test.js
│  ├─ unlock_database.sql
│  ├─ URL_VALIDATOR_DEPLOYMENT.md
│  ├─ URL_VALIDATOR_SPEC.md
│  ├─ URL_VALIDATOR_TESTS.md
│  ├─ VIDEO_PLATFORM_BLOCKING.md
│  └─ WALLET_SYNC_FIX.md
├─ engage-frontend
│  ├─ .env.example
│  ├─ .env.local
│  ├─ eslint.config.js
│  ├─ index.html
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ public
│  │  ├─ mylogo.png
│  │  └─ vite.svg
│  ├─ README.md
│  ├─ src
│  │  ├─ App.css
│  │  ├─ App.jsx
│  │  ├─ assets
│  │  │  └─ react.svg
│  │  ├─ components
│  │  │  ├─ AuthGate.jsx
│  │  │  ├─ Footer.jsx
│  │  │  ├─ Header.jsx
│  │  │  ├─ market
│  │  │  │  ├─ FAQSection.jsx
│  │  │  │  └─ PackCard.jsx
│  │  │  ├─ QuestionAuthoring.jsx
│  │  │  ├─ QuizModal.jsx
│  │  │  ├─ ScrollToTop.jsx
│  │  │  ├─ Sidebar.jsx
│  │  │  ├─ ui
│  │  │  │  ├─ BackButton.jsx
│  │  │  │  ├─ Button.jsx
│  │  │  │  ├─ Card.jsx
│  │  │  │  ├─ Input.jsx
│  │  │  │  └─ Label.jsx
│  │  │  ├─ VisitModal.jsx
│  │  │  └─ wallet
│  │  │     ├─ TransactionDetailModal.jsx
│  │  │     └─ TransactionHistory.jsx
│  │  ├─ hooks
│  │  │  └─ useURLValidation.js
│  │  ├─ index.css
│  │  ├─ lib
│  │  │  ├─ adminApi.js
│  │  │  ├─ api.js
│  │  │  ├─ appState.jsx
│  │  │  ├─ coins.js
│  │  │  ├─ timezone.js
│  │  │  ├─ urlValidator.js
│  │  │  └─ validation.js
│  │  ├─ main.jsx
│  │  └─ pages
│  │     ├─ About.jsx
│  │     ├─ admin
│  │     │  ├─ AdminCampaigns.jsx
│  │     │  ├─ AdminCoinPacks.jsx
│  │     │  ├─ AdminDashboard.jsx
│  │     │  ├─ AdminLimits.jsx
│  │     │  ├─ AdminLogs.jsx
│  │     │  ├─ AdminUserDetails.jsx
│  │     │  ├─ AdminUsers.jsx
│  │     │  └─ AdminWalletAuditLogs.jsx
│  │     ├─ AdminLogin.jsx
│  │     ├─ Analytics.jsx
│  │     ├─ CampaignAnalyticsDetail.jsx
│  │     ├─ Contact.jsx
│  │     ├─ Cookies.jsx
│  │     ├─ Dashboard.jsx
│  │     ├─ Disclaimer.jsx
│  │     ├─ Earn.jsx
│  │     ├─ FAQ.jsx
│  │     ├─ ForgotPassword.jsx
│  │     ├─ Gateway.jsx
│  │     ├─ Guide.jsx
│  │     ├─ Landing.jsx
│  │     ├─ Login.jsx
│  │     ├─ Market.jsx
│  │     ├─ Privacy.jsx
│  │     ├─ Promote.jsx
│  │     ├─ Refund.jsx
│  │     ├─ ResetPassword.jsx
│  │     ├─ Signup.jsx
│  │     ├─ Support.jsx
│  │     ├─ Terms.jsx
│  │     ├─ VerifyEmail.jsx
│  │     └─ Wallet.jsx
│  └─ vite.config.js
├─ FUNCTIONALITY_IMPROVEMENTS.md
├─ QUEUE_FILTERING_LOGIC.md
├─ README.md
├─ UPDATED_REQUIREMENTS.md
├─ USER_GUIDE.md
├─ WALLET_INTEGRATION_SUMMARY.md
└─ WALLET_SYSTEM_README.md

```
```
engage-swap
├─ .claude
│  └─ settings.local.json
├─ ADMIN_PANEL_README.md
├─ AUTO_INCREMENT_EXPLAINED.md
├─ CAMPAIGN_LIMITS_IMPLEMENTATION.md
├─ DEPLOYMENT_FIX.md
├─ engage-backend
│  ├─ .env
│  ├─ .env.example
│  ├─ db
│  │  ├─ create_admin.sql
│  │  ├─ Dump20251015.sql
│  │  ├─ migrations
│  │  │  ├─ fix_otp_foreign_key.sql
│  │  │  └─ reset_auto_increment.sql
│  │  └─ seed_data.sql
│  ├─ MIDNIGHT_RESET_IMPLEMENTATION.md
│  ├─ migrations
│  │  ├─ 000_drop_all_tables.sql
│  │  ├─ 001_create_users_table.sql
│  │  ├─ 001_create_users_table_simple.sql
│  │  ├─ 001_create_users_table_v2.sql
│  │  ├─ 002_add_email_verification.sql
│  │  ├─ 003_create_campaigns_table.sql
│  │  ├─ 003_create_campaigns_table_simple.sql
│  │  ├─ 003_create_campaigns_table_v2.sql
│  │  ├─ 004_create_visits_and_tokens.sql
│  │  ├─ 004_create_visits_and_tokens_simple.sql
│  │  ├─ 004_create_visits_and_tokens_v2.sql
│  │  ├─ 005_add_public_id_users.sql
│  │  ├─ 005_add_public_id_users_v2.sql
│  │  ├─ 006_add_public_id_campaigns.sql
│  │  ├─ 007_add_public_id_visits.sql
│  │  ├─ 008_add_coins_check_constraint.sql
│  │  ├─ 009_update_campaigns_for_total_clicks.sql
│  │  ├─ 010_add_watch_duration_and_decimal_coins.sql
│  │  ├─ 011_add_campaign_questions.sql
│  │  ├─ 012_add_consolation_rewards.sql
│  │  ├─ 012_add_visit_token_to_visits.sql
│  │  ├─ 013_add_campaign_finished_status.sql
│  │  ├─ 014_add_consolation_paused_deleted_reasons.sql
│  │  ├─ 015_make_consolation_campaign_id_nullable.sql
│  │  ├─ 016_update_visit_tokens_campaign_fk.sql
│  │  ├─ 017_add_user_campaign_activity.sql
│  │  ├─ 018_add_campaign_rotation_tracking.sql
│  │  ├─ 019_add_campaign_enforcement_logs.sql
│  │  ├─ 020_add_campaign_limit_config.sql
│  │  ├─ 021_add_user_ip_and_updated_at.sql
│  │  ├─ 022_add_user_is_disabled.sql
│  │  ├─ 023_add_scoring_config.sql
│  │  ├─ 024_add_user_campaign_daily_caps.sql
│  │  ├─ 025_deprecate_users_coins_field.sql
│  │  ├─ 026_add_url_validator_system.sql
│  │  ├─ 027_add_campaign_analytics_system.sql
│  │  ├─ 028_add_soft_delete_to_campaigns.sql
│  │  ├─ 029_add_snapshot_fields_to_visits.sql
│  │  ├─ 030_add_snapshot_fields_to_wallet_transactions.sql
│  │  ├─ 031_add_updated_at_to_campaigns.sql
│  │  ├─ 032_create_pending_users_table.sql
│  │  ├─ add_balance_after_to_transactions.sql
│  │  ├─ add_otp_purpose.sql
│  │  ├─ cleanup_for_public_id.sql
│  │  ├─ coin_market_system.sql
│  │  └─ wallet_system.sql
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ README.md
│  ├─ scripts
│  │  └─ seedAdmin.js
│  ├─ server.js
│  ├─ src
│  │  ├─ config.js
│  │  ├─ db.js
│  │  ├─ middleware
│  │  │  ├─ adminAuth.js
│  │  │  ├─ authRequired.js
│  │  │  ├─ errorHandler.js
│  │  │  ├─ rateLimiter.js
│  │  │  ├─ requestLogger.js
│  │  │  └─ validatorRateLimit.js
│  │  ├─ routes
│  │  │  ├─ admin.js
│  │  │  ├─ analytics.js
│  │  │  ├─ auth.js
│  │  │  ├─ campaigns.js
│  │  │  ├─ earn.js
│  │  │  ├─ health.js
│  │  │  ├─ market.js
│  │  │  ├─ quiz.js
│  │  │  ├─ user.js
│  │  │  ├─ validator.js
│  │  │  └─ wallet.js
│  │  ├─ services
│  │  │  └─ campaignAnalytics.js
│  │  └─ utils
│  │     ├─ analytics.js
│  │     ├─ campaignLimits.js
│  │     ├─ campaignScoring.js
│  │     ├─ consolationConfig.js
│  │     ├─ consolationRewards.js
│  │     ├─ ipAddress.js
│  │     ├─ jwt.js
│  │     ├─ mailer.js
│  │     ├─ otp.js
│  │     ├─ publicId.js
│  │     ├─ questionBank.js
│  │     ├─ questionValidation.js
│  │     ├─ quizRewards.js
│  │     ├─ quizRewardWallet.js
│  │     ├─ timezone.js
│  │     ├─ urlValidator.js
│  │     ├─ validation.js
│  │     ├─ visitToken.js
│  │     └─ wallet.js
│  ├─ tests
│  │  └─ timezone.test.js
│  ├─ unlock_database.sql
│  ├─ URL_VALIDATOR_DEPLOYMENT.md
│  ├─ URL_VALIDATOR_SPEC.md
│  ├─ URL_VALIDATOR_TESTS.md
│  ├─ VIDEO_PLATFORM_BLOCKING.md
│  └─ WALLET_SYNC_FIX.md
├─ engage-frontend
│  ├─ .env.example
│  ├─ .env.local
│  ├─ .env.production
│  ├─ dist
│  │  ├─ assets
│  │  │  ├─ index-DCr8DPiY.js
│  │  │  └─ index-vFEHG0wZ.css
│  │  ├─ index.html
│  │  ├─ mylogo.png
│  │  └─ vite.svg
│  ├─ eslint.config.js
│  ├─ index.html
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ public
│  │  ├─ apple-touch-icon.png
│  │  ├─ favicon-96x96.png
│  │  ├─ favicon.ico
│  │  ├─ favicon.svg
│  │  ├─ mylogo.png
│  │  ├─ site.webmanifest
│  │  ├─ vite.svg
│  │  ├─ web-app-manifest-192x192.png
│  │  └─ web-app-manifest-512x512.png
│  ├─ README.md
│  ├─ src
│  │  ├─ App.css
│  │  ├─ App.jsx
│  │  ├─ assets
│  │  │  └─ react.svg
│  │  ├─ components
│  │  │  ├─ AuthGate.jsx
│  │  │  ├─ Footer.jsx
│  │  │  ├─ Header.jsx
│  │  │  ├─ market
│  │  │  │  ├─ FAQSection.jsx
│  │  │  │  └─ PackCard.jsx
│  │  │  ├─ QuestionAuthoring.jsx
│  │  │  ├─ QuizModal.jsx
│  │  │  ├─ ScrollToTop.jsx
│  │  │  ├─ Sidebar.jsx
│  │  │  ├─ ui
│  │  │  │  ├─ BackButton.jsx
│  │  │  │  ├─ Button.jsx
│  │  │  │  ├─ Card.jsx
│  │  │  │  ├─ Input.jsx
│  │  │  │  └─ Label.jsx
│  │  │  ├─ VisitModal.jsx
│  │  │  └─ wallet
│  │  │     ├─ TransactionDetailModal.jsx
│  │  │     └─ TransactionHistory.jsx
│  │  ├─ hooks
│  │  │  └─ useURLValidation.js
│  │  ├─ index.css
│  │  ├─ lib
│  │  │  ├─ adminApi.js
│  │  │  ├─ api.js
│  │  │  ├─ appState.jsx
│  │  │  ├─ coins.js
│  │  │  ├─ timezone.js
│  │  │  ├─ urlValidator.js
│  │  │  └─ validation.js
│  │  ├─ main.jsx
│  │  └─ pages
│  │     ├─ About.jsx
│  │     ├─ admin
│  │     │  ├─ AdminCampaigns.jsx
│  │     │  ├─ AdminCoinPacks.jsx
│  │     │  ├─ AdminDashboard.jsx
│  │     │  ├─ AdminLimits.jsx
│  │     │  ├─ AdminLogs.jsx
│  │     │  ├─ AdminUserDetails.jsx
│  │     │  ├─ AdminUsers.jsx
│  │     │  └─ AdminWalletAuditLogs.jsx
│  │     ├─ AdminLogin.jsx
│  │     ├─ Analytics.jsx
│  │     ├─ CampaignAnalyticsDetail.jsx
│  │     ├─ Contact.jsx
│  │     ├─ Cookies.jsx
│  │     ├─ Dashboard.jsx
│  │     ├─ Disclaimer.jsx
│  │     ├─ Earn.jsx
│  │     ├─ FAQ.jsx
│  │     ├─ ForgotPassword.jsx
│  │     ├─ Gateway.jsx
│  │     ├─ Guide.jsx
│  │     ├─ Landing.jsx
│  │     ├─ Login.jsx
│  │     ├─ Market.jsx
│  │     ├─ Privacy.jsx
│  │     ├─ Promote.jsx
│  │     ├─ Refund.jsx
│  │     ├─ ResetPassword.jsx
│  │     ├─ Signup.jsx
│  │     ├─ Support.jsx
│  │     ├─ Terms.jsx
│  │     ├─ VerifyEmail.jsx
│  │     └─ Wallet.jsx
│  └─ vite.config.js
├─ FUNCTIONALITY_IMPROVEMENTS.md
├─ QUEUE_FILTERING_LOGIC.md
├─ README.md
├─ UPDATED_REQUIREMENTS.md
├─ USER_GUIDE.md
├─ VPS_DEPLOYMENT_GUIDE.md
├─ WALLET_INTEGRATION_SUMMARY.md
└─ WALLET_SYSTEM_README.md

```