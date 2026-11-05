export function normalizeAnswer(value) {
  return String(value ?? "").trim().toLocaleLowerCase("en-US");
}
export function calculateDeparturePenalty(previousDepartureCount, configuredPenaltySeconds) {
  if (Number(previousDepartureCount) < 1) return 0;
  return Math.max(0, Math.min(600, Math.floor(Number(configuredPenaltySeconds) || 0)));
}
export function isPassing(scorePercent, passPercent = 80) {
  return Number(scorePercent) >= Number(passPercent);
}
export function canRecoverAttempt(deadlineAt, nowSeconds, recoveryUsed) {
  const deadline = Number(deadlineAt);
  const now = Number(nowSeconds);
  return !recoveryUsed && Number.isFinite(deadline) && now >= deadline && now <= deadline + 120;
}
export function arePreviousTopicsPassed(previousTopics) {
  return previousTopics.every(topic => Boolean(topic.examId && topic.passed));
}
export function selectRandomQuestions(questions, count, randomIndex = max => {
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  return value[0] % max;
}) {
  const shuffled = [...questions];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  const requested = Math.max(0, Math.floor(Number(count) || 0));
  return shuffled.slice(0, Math.min(requested, shuffled.length));
}
function parseJson(value, fallback) {
  try { return JSON.parse(value || ""); } catch { return fallback; }
}
export function calculateAssessmentResult(questionRows, answers, passPercent = 80) {
  const feedback = questionRows.map(row => {
    const question = parseJson(row.question_json, {});
    const answerKey = parseJson(row.answer_key_json, {});
    const selectedAnswer = String(answers?.[row.id] ?? "");
    const correctAnswer = String(answerKey.correct ?? "");
    const isCorrect = normalizeAnswer(selectedAnswer) === normalizeAnswer(correctAnswer);
    const points = Math.max(0, Number(row.points) || 0);
    return {
      questionId: row.id,
      prompt: String(question.prompt || ""),
      selectedAnswer,
      correctAnswer,
      isCorrect,
      explanation: String(question.explanation || ""),
      points,
      earnedPoints: isCorrect ? points : 0
    };
  });
  const totalPoints = feedback.reduce((sum, item) => sum + item.points, 0);
  const earnedPoints = feedback.reduce((sum, item) => sum + item.earnedPoints, 0);
  const scorePercent = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 1000) / 10 : 0;
  const correctCount = feedback.filter(item => item.isCorrect).length;
  return {
    scorePercent,
    passPercent: Number(passPercent) || 80,
    passed: isPassing(scorePercent, passPercent),
    correctCount,
    totalQuestions: feedback.length,
    earnedPoints,
    totalPoints,
    feedback
  };
}
