export const SCORE_RULES = {
  WATER_COMPLETE: 10,
  WORKOUT_DONE: 15,
  CALORIES_HIT: 10,
  DAILY_CHECKIN: 5,
  MOTIVATION_SENT: 3,
  POST_PUBLISHED: 2,
} as const

export function calculateScore(habits: {
  waterComplete: boolean
  workoutDone: boolean
  caloriesHit: boolean
  checkinDone: boolean
}): number {
  let score = 0
  if (habits.waterComplete) score += SCORE_RULES.WATER_COMPLETE
  if (habits.workoutDone) score += SCORE_RULES.WORKOUT_DONE
  if (habits.caloriesHit) score += SCORE_RULES.CALORIES_HIT
  if (habits.checkinDone) score += SCORE_RULES.DAILY_CHECKIN
  return score
}

export function getRankEmoji(rank: number): string {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  return '🥉'
}
