import type { ExamQuestion, ExamBreakdown, DomainPerformance, DomainId } from '@/types/scenarios';

/**
 * Loads exam questions from JSON file
 */
export async function loadExamQuestions(): Promise<ExamQuestion[]> {
  try {
    const response = await fetch('/src/data/examQuestions.json');
    if (!response.ok) {
      console.error('Failed to load exam questions:', response.statusText);
      return [];
    }

    const data = await response.json();
    return data.questions || [];
  } catch (error) {
    console.error('Error loading exam questions:', error);
    return [];
  }
}

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Selects questions according to domain weighting
 */
export function selectExamQuestions(
  allQuestions: ExamQuestion[],
  totalQuestions: number = 35
): ExamQuestion[] {
  // Group questions by domain
  const questionsByDomain: Record<DomainId, ExamQuestion[]> = {
    domain1: [],
    domain2: [],
    domain3: [],
    domain4: [],
    domain5: [],
  };

  allQuestions.forEach(q => {
    questionsByDomain[q.domain].push(q);
  });

  // Domain weights from NCP-AII specification
  const domainWeights: Record<DomainId, number> = {
    domain1: 0.31, // 31%
    domain2: 0.05, // 5%
    domain3: 0.19, // 19%
    domain4: 0.33, // 33%
    domain5: 0.12, // 12%
  };

  // Calculate question count per domain
  const questionsPerDomain: Record<DomainId, number> = {
    domain1: Math.round(totalQuestions * domainWeights.domain1),
    domain2: Math.max(1, Math.round(totalQuestions * domainWeights.domain2)), // At least 1
    domain3: Math.round(totalQuestions * domainWeights.domain3),
    domain4: Math.round(totalQuestions * domainWeights.domain4),
    domain5: Math.round(totalQuestions * domainWeights.domain5),
  };

  // Adjust to ensure total is exactly the target
  const currentTotal = Object.values(questionsPerDomain).reduce((a, b) => a + b, 0);
  const diff = totalQuestions - currentTotal;
  if (diff !== 0) {
    // Add/remove from domain4 (largest domain)
    questionsPerDomain.domain4 += diff;
  }

  // Select and shuffle questions from each domain
  const selectedQuestions: ExamQuestion[] = [];

  (Object.keys(questionsPerDomain) as DomainId[]).forEach(domain => {
    const available = questionsByDomain[domain];
    const needed = questionsPerDomain[domain];

    if (available.length < needed) {
      console.warn(`Not enough questions for ${domain}: have ${available.length}, need ${needed}`);
    }

    const shuffled = shuffleArray(available);
    const selected = shuffled.slice(0, Math.min(needed, available.length));
    selectedQuestions.push(...selected);
  });

  // Shuffle the final question order
  return shuffleArray(selectedQuestions);
}

/**
 * Checks if an answer is correct
 */
function isAnswerCorrect(
  question: ExamQuestion,
  userAnswer: number | number[] | string
): boolean {
  const correctAnswer = question.correctAnswer;

  if (question.type === 'multiple-select') {
    // Both should be arrays
    if (!Array.isArray(userAnswer) || !Array.isArray(correctAnswer)) {
      return false;
    }

    // Check if arrays have same length and same elements (order doesn't matter)
    if (userAnswer.length !== correctAnswer.length) {
      return false;
    }

    const sortedUser = [...userAnswer].sort();
    const sortedCorrect = [...correctAnswer].sort();

    return sortedUser.every((val, idx) => val === sortedCorrect[idx]);
  }

  // For single answer questions (multiple-choice, true-false)
  return userAnswer === correctAnswer;
}

/**
 * Calculates exam score and generates detailed breakdown
 */
export function calculateExamScore(
  questions: ExamQuestion[],
  answers: Map<string, number | number[] | string>
): ExamBreakdown {
  let totalPoints = 0;
  let earnedPoints = 0;

  const domainStats: Record<DomainId, { total: number; correct: number; weight: number }> = {
    domain1: { total: 0, correct: 0, weight: 31 },
    domain2: { total: 0, correct: 0, weight: 5 },
    domain3: { total: 0, correct: 0, weight: 19 },
    domain4: { total: 0, correct: 0, weight: 33 },
    domain5: { total: 0, correct: 0, weight: 12 },
  };

  const domainNames: Record<DomainId, string> = {
    domain1: 'Platform Bring-Up',
    domain2: 'Accelerator Configuration',
    domain3: 'Base Infrastructure',
    domain4: 'Validation & Testing',
    domain5: 'Troubleshooting',
  };

  const questionResults: ExamBreakdown['questionResults'] = [];

  questions.forEach(question => {
    totalPoints += question.points;
    domainStats[question.domain].total++;

    const userAnswer = answers.get(question.id);
    const correct = userAnswer !== undefined && isAnswerCorrect(question, userAnswer);

    if (correct) {
      earnedPoints += question.points;
      domainStats[question.domain].correct++;
    }

    questionResults.push({
      questionId: question.id,
      correct,
      userAnswer: userAnswer || '',
      correctAnswer: question.correctAnswer,
      points: question.points,
    });
  });

  const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

  // Build domain performance breakdown
  const byDomain: ExamBreakdown['byDomain'] = {
    domain1: createDomainPerformance('domain1', domainNames, domainStats),
    domain2: createDomainPerformance('domain2', domainNames, domainStats),
    domain3: createDomainPerformance('domain3', domainNames, domainStats),
    domain4: createDomainPerformance('domain4', domainNames, domainStats),
    domain5: createDomainPerformance('domain5', domainNames, domainStats),
  };

  return {
    totalPoints,
    earnedPoints,
    percentage,
    byDomain,
    questionResults,
    timeSpent: 0, // Will be set by caller
  };
}

function createDomainPerformance(
  domainId: DomainId,
  domainNames: Record<DomainId, string>,
  domainStats: Record<DomainId, { total: number; correct: number; weight: number }>
): DomainPerformance {
  const stats = domainStats[domainId];
  const percentage = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

  return {
    domainName: domainNames[domainId],
    questionsTotal: stats.total,
    questionsCorrect: stats.correct,
    percentage,
    weight: stats.weight,
  };
}

/**
 * Determines if exam is passed based on score
 */
export function isExamPassed(breakdown: ExamBreakdown, passingScore: number = 70): boolean {
  return breakdown.percentage >= passingScore;
}

/**
 * Generates a summary message for exam results
 */
export function getExamResultSummary(breakdown: ExamBreakdown, passed: boolean): string {
  const { percentage, totalPoints, earnedPoints, timeSpent } = breakdown;

  const timeMinutes = Math.floor(timeSpent / 60);
  const timeSeconds = timeSpent % 60;

  let summary = passed
    ? `Congratulations! You passed the NCP-AII Practice Exam!\n\n`
    : `You did not pass the NCP-AII Practice Exam.\n\n`;

  summary += `Score: ${earnedPoints}/${totalPoints} points (${percentage}%)\n`;
  summary += `Passing Score: 70%\n`;
  summary += `Time: ${timeMinutes}m ${timeSeconds}s\n\n`;

  summary += `Performance by Domain:\n`;
  Object.values(breakdown.byDomain).forEach(domain => {
    const icon = domain.percentage >= 70 ? '✓' : '✗';
    summary += `  ${icon} ${domain.domainName}: ${domain.questionsCorrect}/${domain.questionsTotal} (${domain.percentage}%)\n`;
  });

  return summary;
}

/**
 * Gets weak domains that need improvement
 */
export function getWeakDomains(breakdown: ExamBreakdown, threshold: number = 70): DomainPerformance[] {
  return Object.values(breakdown.byDomain)
    .filter(domain => domain.percentage < threshold)
    .sort((a, b) => a.percentage - b.percentage);
}

/**
 * Timer class for exam duration tracking
 */
export class ExamTimer {
  private startTime: number;
  private durationSeconds: number;
  private intervalId: number | null = null;
  private onTick?: (remaining: number) => void;
  private onExpire?: () => void;

  constructor(durationSeconds: number) {
    this.startTime = Date.now();
    this.durationSeconds = durationSeconds;
  }

  start(onTick?: (remaining: number) => void, onExpire?: () => void): void {
    this.onTick = onTick;
    this.onExpire = onExpire;

    this.intervalId = window.setInterval(() => {
      const remaining = this.getTimeRemaining();

      if (remaining <= 0) {
        this.stop();
        if (this.onExpire) {
          this.onExpire();
        }
      } else if (this.onTick) {
        this.onTick(remaining);
      }
    }, 1000);
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getTimeRemaining(): number {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    return Math.max(0, this.durationSeconds - elapsed);
  }

  getTimeElapsed(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  formatTimeRemaining(): string {
    const remaining = this.getTimeRemaining();
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
