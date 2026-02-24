/**
 * DifficultyScaler - ELO-like adaptive rating system for incident difficulty
 *
 * Uses a simplified ELO formula to adjust a player's skill rating based on
 * their performance scores. The rating determines which difficulty level of
 * incidents should be recommended to the user.
 *
 * Rating ranges:
 * - 0-899: Beginner
 * - 900-1399: Intermediate
 * - 1400-3000: Advanced
 */

const DEFAULT_RATING = 1000;
const K_FACTOR = 32;
const BEGINNER_CEILING = 900;
const INTERMEDIATE_CEILING = 1400;
const MIN_RATING = 0;
const MAX_RATING = 3000;

export class DifficultyScaler {
  private rating: number;

  constructor(initialRating: number = DEFAULT_RATING) {
    this.rating = Math.max(MIN_RATING, Math.min(MAX_RATING, initialRating));
  }

  /**
   * Records the result of an incident attempt and adjusts the rating.
   * @param score - Score from 0-100 representing performance
   */
  recordResult(score: number): void {
    const normalized = score / 100;
    const expected = 0.6;
    const delta = K_FACTOR * (normalized - expected);
    this.rating = Math.max(
      MIN_RATING,
      Math.min(MAX_RATING, this.rating + delta),
    );
  }

  /**
   * Returns the current rating, rounded to the nearest integer.
   */
  getRating(): number {
    return Math.round(this.rating);
  }

  /**
   * Returns the recommended difficulty level based on current rating.
   */
  getRecommendedDifficulty(): "beginner" | "intermediate" | "advanced" {
    if (this.rating < BEGINNER_CEILING) return "beginner";
    if (this.rating < INTERMEDIATE_CEILING) return "intermediate";
    return "advanced";
  }
}
