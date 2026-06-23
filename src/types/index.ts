export interface Profile {
  id: string
  user_id: string
  name: string
  avatar_url?: string
  weight_current?: number
  weight_goal?: number
  objective?: string
  calories_goal: number
  protein_goal: number
  carbs_goal: number
  fat_goal: number
  water_goal: number
  partner_id?: string
  created_at: string
  updated_at: string
}

export interface DailyHabit {
  id: string
  user_id: string
  date: string
  water_consumed: number
  calories_consumed: number
  protein_consumed: number
  carbs_consumed: number
  fat_consumed: number
  trained: boolean
  checkin_done: boolean
  fitlove_score: number
  created_at: string
}

export interface WaterLog {
  id: string
  user_id: string
  amount_ml: number
  logged_at: string
}

export interface Workout {
  id: string
  user_id: string
  type: string
  duration_minutes: number
  notes?: string
  logged_at: string
}

export interface NutritionLog {
  id: string
  user_id: string
  meal_name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  logged_at: string
}

export interface Post {
  id: string
  user_id: string
  content: string
  image_url?: string
  likes_count: number
  comments_count: number
  created_at: string
  profile?: Profile
  liked_by_me?: boolean
}

export interface Comment {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  profile?: Profile
}

export interface BodyProgress {
  id: string
  user_id: string
  weight?: number
  chest?: number
  waist?: number
  hips?: number
  arm?: number
  thigh?: number
  photo_url?: string
  notes?: string
  recorded_at: string
}

export interface Notification {
  id: string
  user_id: string
  message: string
  read: boolean
  created_at: string
}

export interface MotivationMessage {
  id: string
  from_user_id: string
  to_user_id: string
  message: string
  image_url?: string
  created_at: string
  from_profile?: Profile
}
