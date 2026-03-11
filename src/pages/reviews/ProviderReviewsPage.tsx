import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Star, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { reviewsApi } from '../../api/reviews.api';
import { Spinner } from '../../components/ui/Spinner';
import { Card } from '../../components/ui/Card';
import { StarRating } from '../../components/ui/StarRating';
import type { Review } from '../../types';

// ─── Rating bar ───────────────────────────────────────────────────────────────
function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-4 text-gray-600 text-right">{star}</span>
      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-gray-400 text-xs">{count}</span>
    </div>
  );
}

// ─── Review card ──────────────────────────────────────────────────────────────
function ReviewCard({ review }: { review: Review }) {
  const reviewer = typeof review.reviewerId === 'object' ? review.reviewerId : null;
  const photo = reviewer?.profile?.photoUrl;

  return (
    <Card className="space-y-3">
      <div className="flex items-start gap-3">
        {photo ? (
          <img src={photo} alt={reviewer?.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {(reviewer?.name ?? 'U').charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 text-sm">{reviewer?.name ?? 'Client'}</p>
            <time className="text-xs text-gray-400">
              {format(new Date(review.createdAt), 'MMM d, yyyy')}
            </time>
          </div>
          <StarRating value={review.rating} size="sm" />
        </div>
      </div>

      {review.comment && (
        <p className="text-sm text-gray-700 leading-relaxed pl-13">{review.comment}</p>
      )}
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function ProviderReviewsPage() {
  const { userId } = useParams<{ userId: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', userId],
    queryFn: () => reviewsApi.getByUser(userId!),
    enabled: !!userId,
  });

  if (isLoading) return <Spinner fullPage />;
  if (!data) return (
    <div className="text-center py-20">
      <p className="text-gray-500">No reviews found.</p>
    </div>
  );

  const { user, numberOfReviews, averageRating, reviews } = data as any;

  // Distribution
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r: Review) => r.rating === star).length,
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <Link
        to={`/providers/${userId}`}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to profile
      </Link>

      {/* Summary */}
      <Card className="mb-8">
        <h1 className="text-lg font-bold text-gray-900 mb-4">
          Reviews for {user?.name ?? 'Provider'}
        </h1>

        {numberOfReviews === 0 ? (
          <div className="flex flex-col items-center py-6 text-gray-400">
            <MessageSquare className="w-10 h-10 mb-2 opacity-40" />
            <p className="text-sm">No reviews yet</p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Average */}
            <div className="text-center sm:border-r border-gray-100 sm:pr-6 shrink-0">
              <p className="text-5xl font-black text-gray-900">{averageRating.toFixed(1)}</p>
              <StarRating value={averageRating} size="md" />
              <p className="text-sm text-gray-500 mt-1">{numberOfReviews} review{numberOfReviews !== 1 ? 's' : ''}</p>
            </div>

            {/* Distribution */}
            <div className="flex-1 w-full space-y-1.5">
              {dist.map(({ star, count }) => (
                <RatingBar key={star} star={star} count={count} total={numberOfReviews} />
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Review list */}
      <div className="space-y-4">
        {reviews.map((review: Review) => (
          <ReviewCard key={review._id} review={review} />
        ))}
      </div>
    </div>
  );
}
