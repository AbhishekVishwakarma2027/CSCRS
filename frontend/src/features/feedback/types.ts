export interface RatingDistribution {
  one_star: number
  two_star: number
  three_star: number
  four_star: number
  five_star: number
}

export interface FeedbackDashboardResponse {
  total_feedback: number
  average_rating: number
  rating_distribution: RatingDistribution
}
