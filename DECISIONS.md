# Design Decisions

Decisions made during implementation that are not explicitly resolved in the PID.

## 1. Questions with dash option_e (strategy_h, strategy_k)

Two questions (`strategy_h`, `strategy_k`) have `option_e` set to `"–"` (an en-dash character) rather than meaningful answer text. The PID states all 157 questions have option_e populated with max_score=10.

**Decision:** Treat option_e values consisting only of dash characters (`–`, `—`, `-`) as non-selectable. Do not render the E answer card for these questions. The max_score remains 10 as per the seed data, meaning these questions' maximum achievable score is 6 (option D). This effectively lowers the domain maximum for Strategy by 8 points (from 240 to 232 achievable). The scoring engine uses max_score from the database for domain totals, so the reported domain max will still be 240. This discrepancy should be reviewed with the TBM Council to confirm whether max_score for these questions should be 6 instead of 10.

## 2. Consultant assignment

The PID states consultant assignment per assessment is managed operationally — not automated in Phase 1. Consultants with the `consultant` role can view all assessments. There is no per-assessment consultant assignment in the data model.

## 3. Report PDF upload

Phase 1 does not include automated PDF generation. The consultant or TBM Council team uploads the finished PDF via a simple file upload mechanism. The API stores it on the local filesystem with an S3-compatible path abstraction for Phase 2 migration.

## 4. Email in development

In development mode (NODE_ENV=development), emails are logged to console rather than sent via SendGrid/SMTP. This allows full testing without email infrastructure.

## 5. User email uniqueness

The User table has a unique constraint on email. When the same email is assigned to multiple domains, a single User record is created/reused. Multiple DomainAssignment records point to the same User, each with its own access token.
