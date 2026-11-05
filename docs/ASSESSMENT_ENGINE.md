# ENGLISH MASTER — Topic Assessment Engine

## Learning sequence
A published course contains ordered, published topics. Each published topic is linked to one published assessment. A learner may open the first topic. Every later topic remains locked until the learner has a submitted attempt at or above that assessment's configured pass percentage. The default is 80%; administrators may configure a different threshold for each topic assessment.

## Assessment attempts
- An assessment is linked to one lesson/topic.
- The server chooses a randomized question subset and order for each attempt.
- Correct answers remain server-side and are never sent before submission.
- Scores are calculated from question points on the server.
- Results include the score, pass/fail state, correct answers, explanations, and per-question feedback.
- A failed attempt does not unlock the next topic. A new attempt receives a fresh randomized question set.
- The default selection is up to 10 questions from the topic bank; administrators may configure 1–50.

## Timing and interruptions
- The server creates the deadline when an attempt starts. The browser countdown is informational; the server decides whether submission is on time.
- A visibilitychange event to hidden is recorded as a page-visibility interruption signal. It is not proof of cheating and the UI must not accuse a learner.
- The first recorded interruption warns without reducing time. Each later distinct event reduces the server deadline by the configured penalty (default 30 seconds).
- Event IDs are unique per attempt so retries and duplicate browser requests cannot apply the same penalty twice.
- blur and ordinary focus events are not used as integrity evidence.
- A learner can resume an active attempt after refresh or a connection interruption. If the deadline has just passed, one explicit, one-time technical recovery is available for up to two minutes after expiry and grants a two-minute completion window. It is not represented as proof that an outage occurred.

## API
- GET /api/learning/topics — published topics and learner progression.
- POST /api/learning/attempts — start or resume the current topic assessment.
- GET /api/learning/attempts/:id — restore the attempt, saved answers, timer and result.
- POST /api/learning/attempts/:id/answers — persist answers for recovery.
- POST /api/learning/attempts/:id/departures — record one deduplicated visibility interruption.
- POST /api/learning/attempts/:id/recover — use the one-time technical recovery.
- POST /api/learning/attempts/:id/submit — server-side scoring and feedback.

All student endpoints require a verified Google session. The browser never receives answer keys.

## D1 migration
Before enabling the feature in any environment, apply migrations/0002_topic_assessment_engine.sql to that environment's english-master-db D1 database. Review the migration and confirm the target database first. This pull request does not run the migration against production.

## Payments
This feature does not enable checkout, live payment collection, deposits, or refunds. Those remain blocked pending local legal, accounting, provider, refund and privacy verification.
