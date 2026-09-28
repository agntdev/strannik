# STrANNIK — Quiz & Rewards — Bot specification

**Archetype:** community

**Voice:** warm and encouraging — write every user-facing message, button label, error, and empty state in this voice.

STrANNIK is a gamified Telegram bot where casual users play multiple-choice quizzes, complete light tasks, submit promo videos, invite friends, earn points, view leaderboards, and redeem rewards in a prize shop; admin review gates sensitive actions (video verification, physical prize fulfillment) and all point transactions are auditable.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- Casual mobile Telegram users who enjoy short quizzes and social rewards
- Community managers/admins who moderate submissions and fulfill prizes

## Success criteria

- New users can onboard via /start and see balance, referral link and quick actions
- Users complete quizzes and balances update correctly (+100 per correct, −50 per wrong, floored at 0) with session summary
- Users can accept tasks, submit proof, and receive admin-verified rewards
- Video submissions follow guided requirements, are routed to admin for verification, and verified rewards are applied
- Referral links are issued and referral bonuses are credited automatically after displayed conditions are met
- Users browse the shop, redeem items subject to balance and inventory, and redemption records are created and notified to admin
- Admin receives notifications for video submissions, suspicious activity, and large redemptions (to ADMIN_CHAT_ID) and can audit transactions

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — Open the main menu and onboarding summary (welcome, rules, balance, referral link, quick actions)
  - outputs: main_menu_buttons, user_summary_card
- **Play Quiz** (button, actor: user, callback: quiz:start) — Start a quiz session: pick a category then answer multiple-choice questions
  - inputs: category_choice (via inline buttons)
  - outputs: question_by_question prompts (callback), session_score, final_summary
- **Tasks** (button, actor: user, callback: tasks:list) — View available tasks, accept tasks, and submit proof
  - inputs: task_accept (callback), submission (text/link/photo via message)
  - outputs: task_status_updates, admin_submission_notification
- **Video for Prize** (button, actor: user, callback: video:flow) — Guided flow: show exact requirements, request public link + view count, and submit for admin review
  - inputs: video_public_link, view_count (number)
  - outputs: submission_record, admin_notification
- **Shop** (button, actor: user, callback: shop:browse) — Browse prize shop (paginated), view item details, and confirm redemption
  - inputs: pagination callbacks, redeem_confirm (callback)
  - outputs: redemption_record, balance_update, admin_notification_if_physical
- **Leaderboard** (button, actor: user, callback: leaderboard:view) — View top users for day/week/month/all-time and user's own rank
  - inputs: time_window_choice (callback)
  - outputs: leaderboard_list, user_rank_row
- **My Profile** (button, actor: user, callback: profile:view) — See personal stats: balance, earned history, inventory, referral link and status
  - outputs: profile_card, action_buttons (Invite, Shop, Tasks)
- **/help** (command, actor: user, command: /help) — Fallback help surface explaining rules, penalties, and admin contact
  - outputs: help_text

## Flows

### Onboarding & Main Menu
_Trigger:_ /start

1. Create or load user profile by Telegram id
2. Show welcome, short rules (scoring, penalties, hashtag requirement for videos), current balance and referral link
3. Present quick action buttons: Play Quiz, Tasks, Shop, Leaderboard, My Profile, Invite
4. Log onboarding event

_Data touched:_ UserProfile, Referral

### Play Quiz (single session)
_Trigger:_ callback quiz:start

1. Show 12 seeded categories as inline buttons
2. User selects category (callback)
3. Start session: pull a question set for that category; store session (session id, question index, running score)
4. Send question text and multiple-choice buttons; user answers via callback
5. Apply scoring: +100 for correct; −50 for wrong but not allowing balance to go below 0; update running session score and persistent user balance immediately
6. Continue until session ends or user quits; send final summary with earned points and updated balance

_Data touched:_ Quiz, Question, QuizSession(session), UserProfile, Transaction

### Tasks: accept, submit, verify
_Trigger:_ callback tasks:list

1. List available tasks with condition summaries and rewards (paginated inline buttons)
2. User taps Accept (callback) to mark task accepted; create TaskAssignment record
3. User submits proof (message with text/link/image) referencing task id (bot uses ForceReply or prompts to attach media)
4. Create submission record and send admin notification for verification if task requires manual review; otherwise auto-verify based on rule
5. On verification, award points, update user's transaction ledger and notify user of completion

_Data touched:_ Task, TaskAssignment, Submission, Transaction, UserProfile

### Video-for-Prize Submission
_Trigger:_ callback video:flow

1. Show exact video requirements (hashtag, view-goal 5,000) and sample acceptable proofs
2. Request public video link and view count (ForceReply or form-like prompts)
3. Store submission; allow user to update proof/stats until they tap Submit for Review
4. On Submit, send admin notification (ADMIN_CHAT_ID) with submission details and direct link to admin verification actions
5. Admin verifies; on approval, award 5000 points and mark submission verified; on rejection, send feedback to user

_Data touched:_ VideoSubmission, Submission, Transaction, UserProfile, AdminAction

### Referral Invite & Credit
_Trigger:_ user requests referral from profile /start

1. Provide a personal referral deep link and human-readable unlock conditions (default: referred user completes onboarding + first quiz)
2. Track referral clicks and referred user id mapping
3. When referred user meets conditions, credit the referrer with configured bonus points and log transaction; notify both parties

_Data touched:_ Referral, UserProfile, Transaction

### Shop Redemption
_Trigger:_ callback shop:browse

1. Show paginated shop items with cost, available quantity and category
2. User opens an item and taps Redeem; bot checks balance and inventory atomically
3. If insufficient balance or out of stock, show an immediate message; otherwise create Redemption record and decrement inventory
4. If item requires admin confirmation (physical), notify admin with redemption details; otherwise mark claim as issued and optionally decrement inventory immediately
5. Update user's inventory and balance, and log transaction

_Data touched:_ Prize, Redemption, Inventory, Transaction, UserProfile

### Leaderboard view
_Trigger:_ callback leaderboard:view

1. User selects time window (day/week/month/all-time) via inline buttons
2. Query top N users for that window, return a paginated leaderboard and highlight requester's rank
3. Handle ties deterministically (score then earliest timestamp)

_Data touched:_ LeaderboardEntry, Transaction, UserProfile

### Admin verification & adjustments
_Trigger:_ admin action via admin UI or bot admin commands

1. Admin views pending video/task/submission/redemption items
2. Admin approves/rejects with optional note; approval triggers awarding points or confirming fulfillment
3. Admin can manually adjust balances with reason; every action writes an audit Transaction and AdminAction log

_Data touched:_ AdminAction, Transaction, VideoSubmission, Task, Redemption

## Owner-supplied settings

The OWNER provides these; they are collected in chat and injected into the environment at deploy. Read each one from the environment where it is used (`ctx.env.<KEY>` / `env.<KEY>` on Cloudflare Workers; `process.env.<KEY>` only as a Node/harness fallback — never the sole read). Do NOT invent your own way of learning the value, do NOT ask for it in a bot message, and do NOT hardcode a default.

- **ADMIN_CHAT_ID** — Where new video submissions, suspicious activity, large redemptions and support messages are sent
  - this is the OWNER's own chat id; the platform already knows it. Read `ADMIN_CHAT_ID` via `ctx.env` (prefer toolkit `adminChatId` / `requireOwner`) — never ask a user, never treat whoever writes first as the admin, never invent claim-admin or open manage for everyone.
  - may be UNSET at runtime: the bot must still start, and the feature needing ADMIN_CHAT_ID must say so plainly instead of failing.

Your behavioral specs run WITHOUT these values, so no spec may depend on one.

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

An entity that merely NAMES an owner-supplied setting above (an admin chat, an API account) is not something to store or discover — read it from the environment.

- **UserProfile** _(retention: persistent)_ — Persistent record per Telegram user: visible name, username, Telegram id, referrer id, current balance, earned history summary, inventory of claimed prizes, settings
  - fields: telegram_id, username, display_name, referrer_id, balance, earned_points_total, inventory_ids, created_at, last_active
- **Quiz** _(retention: persistent)_ — Quiz category and question group metadata
  - fields: quiz_id, category, seeded_flag, question_ids
- **Question** _(retention: persistent)_ — Single multiple-choice question
  - fields: question_id, text, choices, correct_choice_index, explanation (optional), category, created_by
- **QuizSession** _(retention: session)_ — Ephemeral per-play session storing progress and running score
  - fields: session_id, user_id, quiz_id, current_index, running_score, answers[], started_at
- **Task** _(retention: persistent)_ — Task definition with conditions and reward
  - fields: task_id, title, description, reward_points, conditions, requires_manual_verification, availability
- **TaskAssignment** _(retention: persistent)_ — User acceptance and completion state for tasks
  - fields: assignment_id, task_id, user_id, status, submitted_proof_id, accepted_at, completed_at
- **VideoSubmission** _(retention: persistent)_ — Promo video submission record
  - fields: submission_id, user_id, public_link, hashtag_check, submitted_view_count, admin_status, admin_note, verified_at
- **Referral** _(retention: persistent)_ — Mapping of referrer and referred users, link tokens and status
  - fields: referral_token, referrer_id, referred_id, status, credited_at
- **Prize** _(retention: persistent)_ — Shop item definition
  - fields: prize_id, title, description, cost_points, quantity_available, category, requires_admin_confirmation, metadata
- **Redemption** _(retention: persistent)_ — Record of a user redeeming a shop item
  - fields: redemption_id, user_id, prize_id, status, created_at, admin_note
- **Transaction** _(retention: persistent)_ — Audit log for every point change and admin action
  - fields: transaction_id, user_id, delta_points, balance_before, balance_after, reason, initiator (system/admin/user), timestamp
- **Submission** _(retention: persistent)_ — Generic submission container for task proofs (text/link/image) referencing tasks or video flows
  - fields: submission_id, user_id, task_id_or_type, content_meta, attachments, status, admin_note
- **AdminAction** _(retention: persistent)_ — Record of actions performed by admins for audit
  - fields: action_id, admin_user_id, action_type, target_id, notes, timestamp
- **LeaderboardEntry** _(retention: persistent)_ — Cacheable entry for leaderboards per time window
  - fields: user_id, score, window_start, window_end, rank

## Integrations

- **Telegram** (required) — Bot API messaging, inline keyboards, callback queries and file/media handling
- **Telegram Channel (optional)** (optional) — Optional public channel for announcements and winners (owner-configurable)
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Owner controls

- View and manage tasks (create/edit/disable)
- Manage shop items and inventory (create/edit/quantity, mark physical vs digital)
- Review and verify video and task submissions
- Adjust user balances with reason and see audit logs
- Configure referral campaign text and conditions
- Set admin notification threshold for 'large redemptions' (missing default)
- Toggle optional public announcements channel (off by default)

## Notifications

- Admin: new video submission for review (ADMIN_CHAT_ID)
- Admin: suspicious activity alerts (rate limits/referral anomalies/high-value redemptions)
- Admin: large redemption or low inventory alerts
- User: balance changes and transaction receipts (on every awarded/deducted amount)
- User: task submission status changes (accepted, pending review, approved, rejected)
- User: video submission verification result with admin note
- User: referral bonus credited
- User: shop redemption confirmation and next steps (if physical)

## Permissions & privacy

- Store minimal profile PII: Telegram id, username and display name; do not share except with admins for moderation/fulfillment
- Public video links provided by users are stored and may be posted to optional public channel only with owner-configured settings; bot does not reshare otherwise
- All point transactions and admin actions are auditable and retained; owners/admins can request user data deletion which will anonymize profile but keep non-identifying audit
- Referral tracking uses tokens and Telegram ids; owners must not export PII without user consent
- No external payment processors or shipping data are stored by the bot by default (fulfillment handled manually by admin)

## Edge cases

- Concurrent redemptions causing inventory race: ensure atomic check-and-decrement; on conflict notify user and refund if needed
- Quiz session interrupted (bot restart or network): store session state and allow resume or graceful termination with partial scoring
- User-submitted video link invalid/unreachable or missing hashtag: record and prompt user to correct before admin review
- Referral fraud (self-referral, mass fake accounts): flag suspicious patterns and route to admin for manual review
- Balance floor enforcement: never allow a user balance to go negative even under race conditions
- Admin unavailable: pending verifications queue with escalation notifications; allow owner to set multiple ADMIN_CHAT_IDs later (missing field)
- Leaderboard ties and pagination decisions need deterministic tie-breaker (timestamp) — not fully specified
- File size/type limits for submissions not specified — reject or instruct user when unsupported

## Required tests

- Onboarding acceptance test: /start creates profile, shows referral link and menu
- Full quiz dialog test: pick category, answer sequence including correct and wrong answers, verify +100/−50 rules and final summary and balance floored at 0
- Task lifecycle test: accept task, submit proof (text and image variations), admin approval path and reward application, rejection path with feedback
- Video submission test: guided flow, invalid hashtag detection, submission, admin verification and awarding 5000 points
- Referral crediting test: referred user completes onboarding + first quiz and referrer receives configured bonus; verify transaction audit
- Shop redemption test: successful redemption (digital), insufficient-balance rejection, out-of-stock handling and atomic inventory decrement under concurrent requests
- Leaderboard test: correct top N ordering for each window and accurate user rank highlighting
- Admin adjust-balance test: manual balance change logs correct Transaction and notifies user
- Audit trail test: every point change has an immutable Transaction record with initiator and reason

## Assumptions

- Quiz categories are the 12 seeded topics provided by the brief (Cars, Nature, Geography, Animals, Sports, Games, Films, Technology, Logic, History, Space, Food)
- Points per correct answer are +100; penalty per wrong answer is fixed −50 (floored at zero)
- Video reward is 5,000 points awarded only after admin verification when submitted proof shows 5,000+ views and required hashtag
- Referral unlock criteria default: referred user completes onboarding plus first quiz; this can be adjusted by admin later
- Admin is a single chat id (ADMIN_CHAT_ID); multi-admin roles and RBAC are out of scope unless owner requests
- Prize fulfillment (shipping, contact info) is handled manually by admin off-platform
