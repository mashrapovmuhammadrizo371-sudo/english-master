import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateAssessmentResult,
  calculateDeparturePenalty,
  arePreviousTopicsPassed,
  canRecoverAttempt,
  selectRandomQuestions
} from "../functions/api/learning/assessment-utils.js";
test("scores weighted answers and returns per-question feedback", () => {
  const result = calculateAssessmentResult([
    { id: "q1", question_json: JSON.stringify({ prompt: "One?", explanation: "Because one." }), answer_key_json: JSON.stringify({ correct: "A" }), points: 2 },
    { id: "q2", question_json: JSON.stringify({ prompt: "Two?" }), answer_key_json: JSON.stringify({ correct: "B" }), points: 1 }
  ], { q1: " a ", q2: "wrong" }, 80);
  assert.equal(result.scorePercent, 66.7);
  assert.equal(result.passed, false);
  assert.equal(result.correctCount, 1);
  assert.equal(result.feedback[0].explanation, "Because one.");
  assert.equal(result.feedback[1].earnedPoints, 0);
});
test("uses the configured pass threshold with 80 percent as default", () => {
  const rows = [{ id: "q1", question_json: '{"prompt":"Q"}', answer_key_json: '{"correct":"yes"}', points: 1 }];
  assert.equal(calculateAssessmentResult(rows, { q1: "yes" }).passed, true);
  assert.equal(calculateAssessmentResult(rows, { q1: "no" }, 90).passed, false);
});
test("first confirmed departure warns without a penalty; later departures apply it", () => {
  assert.equal(calculateDeparturePenalty(0, 30), 0);
  assert.equal(calculateDeparturePenalty(1, 30), 30);
  assert.equal(calculateDeparturePenalty(4, 45), 45);
});
test("retakes use a new randomized subset while respecting the requested count", () => {
  const questions = ["a", "b", "c", "d", "e"];
  const first = selectRandomQuestions(questions, 3, max => max - 1);
  const second = selectRandomQuestions(questions, 3, () => 0);
  assert.equal(first.length, 3);
  assert.equal(second.length, 3);
  assert.notDeepEqual(first, second);
  assert.deepEqual(selectRandomQuestions(questions, 10, () => 0).sort(), questions.sort());
});
test("progression stays locked until every earlier topic has a passed assessment", () => {
  assert.equal(arePreviousTopicsPassed([]), true);
  assert.equal(arePreviousTopicsPassed([{ examId: "e1", passed: true }]), true);
  assert.equal(arePreviousTopicsPassed([{ examId: "e1", passed: true }, { examId: "e2", passed: false }]), false);
  assert.equal(arePreviousTopicsPassed([{ examId: null, passed: false }]), false);
});
test("technical recovery is one-time and limited to two minutes after the deadline", () => {
  assert.equal(canRecoverAttempt(100, 180, false), true);
  assert.equal(canRecoverAttempt(100, 221, false), false);
  assert.equal(canRecoverAttempt(100, 120, true), false);
});
