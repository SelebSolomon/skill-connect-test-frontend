import { api } from './axios';
import type { Review, ReviewsResult, CreateReviewDto } from '../types';

export const reviewsApi = {
  getByUser: (userId: string): Promise<ReviewsResult> =>
    api.get<ReviewsResult>(`/reviews/user/${userId}`).then((r) => r.data),

  create: (dto: CreateReviewDto): Promise<Review> =>
    api.post<Review>('/reviews', dto).then((r) => r.data),

  update: (id: string, dto: { rating?: number; comment?: string }): Promise<{ message: string; data: Review }> =>
    api.patch<{ message: string; data: Review }>(`/reviews/${id}`, dto).then((r) => r.data),

  remove: (id: string): Promise<{ message: string }> =>
    api.delete<{ message: string }>(`/reviews/${id}`).then((r) => r.data),
};
