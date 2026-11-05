# ENGLISH MASTER — Product Strategy

## Vision
An Uzbek-first English learning platform developing practical skills from CEFR A1 to C2 and supporting IELTS preparation. Do not claim official certification or scores unless issued by an authorized provider.

## Learning model
Learn → Guided Practice → Independent Practice → Topic Test → Feedback → Review or Unlock Next Topic.

## Four skills
Assess Reading, Listening, Writing, and Speaking separately. Give each learner a personal path based on demonstrated performance.

## Topic tests
- Every completed topic ends with a topic-specific test.
- Default pass threshold: 80%, configurable per course.
- Retakes use a randomized question set.
- Show score, explanations, mistakes, and recommended review.
- Writing and Speaking use published rubrics; AI feedback is clearly labelled as an estimate.

## Test integrity
- Explain rules before a timed test.
- First confirmed departure from the active test page: warn and log the event.
- Second and later confirmed departures: apply the configured penalty (initial default 30 seconds).
- Deduplicate browser events; use server-authoritative timing and auditable logs.
- Focus loss is an imperfect signal, not proof of cheating. Provide recovery for calls, crashes, accessibility tools, and network interruptions.
- Do not claim browsers can detect every external app, device, or form of assistance.

## AI Teacher
Adapt to the learner's level; teach vocabulary in context; prioritize active practice; correct errors kindly; develop all four skills; distinguish practice feedback from official exam results.

## Modules
1. Learning & Content: courses, topics, vocabulary, practice, completion.
2. Assessment Engine: question banks, timers, scoring, retakes, feedback, integrity events.
3. AI Teacher: level-aware tutoring and skill-specific practice.
4. Learner Profile: skill levels, progress, history, personal path.
5. Payments & Trust: plans, payment integration, receipts, refund/deposit ledger, support and disclosures.

## Pricing
- Free plan with clearly disclosed limits.
- Paid plan with clearly disclosed features, price, renewal and cancellation terms.
- Optional learning-deposit model only after legal, accounting, and payment-provider review. Publish deposit amount, eligibility, successful-completion definition, refund amount/timeline, fees, failed-attempt rules, withdrawal rights, and dispute process before collecting money.
- Never promise guaranteed refunds until the legal and operational mechanism is verified. Never store card details; verify payment status server-side.

## Trust and launch gates
Before taking payments, verify local legal requirements with qualified counsel/accounting support; publish Terms, Privacy, Refund/Deposit Policy and support contact; use an authorized provider; reconcile transactions in an auditable ledger; define data retention and access controls. Never claim registration or security certification unless verified.

## Roadmap
1. Learning foundation: content schema, topic completion, tests, feedback, retakes, progress, then D1 persistence.
2. Assessment integrity: server timers, event logs, warning/penalty policy, recovery and mobile testing.
3. AI Teacher: versioned instructions, level-aware context, skill rubrics and quality evaluation.
4. Payments: server-side entitlements and reviewed payment/deposit/refund model; then IELTS expansion and mobile app.

## Success metrics
Topic completion, pass rates, skill progress, retake improvement, weekly engagement, support/refund resolution time, and false-positive interruption rate.
