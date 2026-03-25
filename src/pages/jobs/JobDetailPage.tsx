import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, DollarSign, Calendar, ArrowLeft, Pencil, Trash2, User, Star, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { jobsApi } from '../../api/jobs.api';
import { bidsApi } from '../../api/bids.api';
import { reviewsApi } from '../../api/reviews.api';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { Badge, jobStatusBadge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Textarea';
import { Input } from '../../components/ui/Input';
import { StarRating } from '../../components/ui/StarRating';
import { BidCard } from '../../components/shared/BidCard';
import { useAuthStore } from '../../store/auth.store';
import { getErrorMessage } from '../../hooks/useErrorMessage';
import type { Service, User as UserType } from '../../types';

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [bidDays, setBidDays] = useState('');
  const [message, setMessage] = useState('');
  const [bidError, setBidError] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState('');

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobsApi.getJobById(id!),
    enabled: !!id,
  });

  const { data: bids } = useQuery({
    queryKey: ['job-bids', id],
    queryFn: () => jobsApi.getBidsForJob(id!),
    enabled: !!id && user?.role === 'client',
  });

  const deleteMutation = useMutation({
    mutationFn: () => jobsApi.deleteJob(id!),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['jobs'] }); navigate('/jobs/my'); },
    onError: (err) => setDeleteError(getErrorMessage(err)),
  });

  const completeMutation = useMutation({
    mutationFn: () => jobsApi.completeJob(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job', id] }),
  });

  const [assignError, setAssignError] = useState('');
  const assignProviderMutation = useMutation({
    mutationFn: (providerId: string) => jobsApi.assignProvider(id!, providerId),
    onSuccess: () => {
      setAssignError('');
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      queryClient.invalidateQueries({ queryKey: ['job-bids', id] });
    },
    onError: (err) => setAssignError(getErrorMessage(err)),
  });

  const submitReviewMutation = useMutation({
    mutationFn: () => reviewsApi.create({
      jobId: id!,
      revieweeId: typeof job?.providerId === 'string' ? job.providerId : (job?.providerId as any)?._id,
      rating: reviewRating,
      comment: reviewComment || undefined,
    }),
    onSuccess: () => {
      setReviewModalOpen(false);
      setReviewRating(5); setReviewComment(''); setReviewError('');
      queryClient.invalidateQueries({ queryKey: ['job', id] });
    },
    onError: (err) => setReviewError(getErrorMessage(err)),
  });

  const submitBidMutation = useMutation({
    mutationFn: () => bidsApi.submitBid({
      jobId: id!,
      proposedPrice: Number(bidAmount),
      estimatedDuration: Number(bidDays),
      message,
    }),
    onSuccess: () => {
      setBidModalOpen(false);
      setBidAmount(''); setBidDays(''); setMessage(''); setBidError('');
      queryClient.invalidateQueries({ queryKey: ['my-bids'] });
    },
    onError: (err) => setBidError(getErrorMessage(err)),
  });

  const milestoneMutation = useMutation({
    mutationFn: ({ milestoneId, status }: { milestoneId: string; status: 'pending' | 'completed' | 'paid' }) =>
      jobsApi.updateMilestoneStatus(id!, milestoneId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job', id] }),
  });

  if (isLoading) return <Spinner fullPage />;
  if (!job) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Job not found.</p>
      <Link to="/jobs"><Button variant="outline" className="mt-4">Back to Jobs</Button></Link>
    </div>
  );

  const service = job.serviceId as Service | undefined;
  const client = job.clientId as UserType | undefined;
  const provider = job.providerId as UserType | undefined;
  const isOwner = user?.sub === (typeof job.clientId === 'string' ? job.clientId : client?._id);
  const canBid = isAuthenticated && user?.role === 'provider' && job.status === 'open';
  const canComplete = isOwner && job.status === 'in_progress';
  const canReview = isOwner && job.status === 'completed' && job.providerId;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
          {job.imageUrl && (
            <img
              src={job.imageUrl}
              alt={job.title}
              className="w-full h-48 sm:h-64 object-cover rounded-2xl"
            />
          )}

          <Card>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {jobStatusBadge(job.status)}
                  {service && <Badge variant="primary">{typeof service === 'object' ? service.name : service}</Badge>}
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              </div>
              {isOwner && (
                <div className="flex gap-2">
                  <Link to={`/jobs/${job._id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={job.status !== 'open'}
                    title={job.status !== 'open' ? 'Only open jobs can be deleted' : 'Delete job'}
                    onClick={() => { setDeleteError(''); setDeleteModalOpen(true); }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{job.description}</p>

            <div className="mt-6 flex flex-wrap gap-6 text-sm text-gray-600 border-t border-gray-100 pt-4">
              <span className="flex items-center gap-1.5 font-semibold text-green-600">
                <DollarSign className="w-4 h-4" />
                Budget: ${job.budget?.toLocaleString()}
              </span>
              {job.jobLocation && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {job.jobLocation}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Posted {format(new Date(job.createdAt), 'MMM d, yyyy')}
              </span>
            </div>
          </Card>

          {/* Milestones */}
          {job.milestones?.length > 0 && (
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">Milestones</h3>
              <div className="space-y-3">
                {job.milestones.map((m, i) => {
                  const milestoneId = m._id ?? '';
                  const isPending = m.status === 'pending';
                  const isCompleted = m.status === 'completed';
                  const isPaid = m.status === 'paid';
                  // Provider marks pending → completed; client marks completed → paid
                  const canMarkComplete = user?.role === 'provider' && isPending && job.status === 'in_progress';
                  const canMarkPaid = isOwner && isCompleted && job.status === 'in_progress';
                  return (
                    <div key={m._id ?? i} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50">
                      <div className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${isPaid ? 'bg-green-100 text-green-800' : isCompleted ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-600'}`}>
                        {isPaid || isCompleted ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-gray-900 text-sm">{m.title}</p>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isPaid ? 'bg-green-100 text-green-700' : isCompleted ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                            {m.status}
                          </span>
                          {m.amount && (
                            <span className="text-xs text-gray-400">₦{m.amount.toLocaleString()}</span>
                          )}
                        </div>
                        {m.description && <p className="text-sm text-gray-500 mt-0.5">{m.description}</p>}
                        {(canMarkComplete || canMarkPaid) && milestoneId && (
                          <button
                            disabled={milestoneMutation.isPending}
                            onClick={() => milestoneMutation.mutate({
                              milestoneId,
                              status: canMarkComplete ? 'completed' : 'paid',
                            })}
                            className="mt-2 text-xs font-medium px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                          >
                            {canMarkComplete ? 'Mark Complete' : 'Mark Paid'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Bids (client only) */}
          {isOwner && bids && bids.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Bids ({bids.length})</h3>
              {assignError && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  {assignError}
                </div>
              )}
              <div className="space-y-4">
                {bids.map((bid: any) => (
                  <BidCard
                    key={bid._id}
                    bid={bid}
                    showJob={false}
                    onAssign={job.status === 'open' ? (b) => assignProviderMutation.mutate(
                      typeof b.providerId === 'string' ? b.providerId : (b.providerId as any)?._id,
                    ) : undefined}
                    isAssigning={assignProviderMutation.isPending}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4 order-1 lg:order-2">
          {/* Client info */}
          <Card>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Posted by
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white font-bold">
                {(typeof client === 'object' ? client?.name : 'U')?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {typeof client === 'object' ? client?.name : 'Client'}
                </p>
                <p className="text-xs text-gray-500">Client</p>
              </div>
            </div>
          </Card>

          {/* Action card */}
          {canBid && (
            <Card>
              <h3 className="font-semibold text-gray-900 mb-2">Interested?</h3>
              <p className="text-sm text-gray-500 mb-4">Submit a bid to get hired for this job.</p>
              <Button fullWidth onClick={() => setBidModalOpen(true)}>
                Submit a Bid
              </Button>
            </Card>
          )}

          {canComplete && (
            <Card>
              <h3 className="font-semibold text-gray-900 mb-1">Job Complete?</h3>
              <p className="text-sm text-gray-500 mb-4">
                Mark this job as done once{' '}
                {typeof provider === 'object' ? provider?.name : 'the provider'} has finished.
                A 5% platform commission will be recorded.
              </p>
              <Button
                fullWidth
                loading={completeMutation.isPending}
                onClick={() => completeMutation.mutate()}
              >
                Mark as Complete
              </Button>
            </Card>
          )}

          {canReview && (
            <Card>
              <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                Leave a Review
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                How did {typeof provider === 'object' ? provider?.name : 'the provider'} do?
              </p>
              <Button fullWidth onClick={() => setReviewModalOpen(true)}>
                Write a Review
              </Button>
            </Card>
          )}

          {!isAuthenticated && (
            <Card>
              <p className="text-sm text-gray-600 mb-3">Sign in to submit a bid for this job.</p>
              <Link to="/login">
                <Button fullWidth>Sign in</Button>
              </Link>
            </Card>
          )}
        </div>
      </div>

      {/* Bid Modal */}
      <Modal open={bidModalOpen} onClose={() => setBidModalOpen(false)} title="Submit a Bid" size="md">
        <div className="space-y-4">
          {bidError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{bidError}</div>
          )}
          <Input
            label="Your bid amount ($)"
            type="number"
            placeholder="e.g. 500"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
          />
          <Input
            label="Delivery time (days)"
            type="number"
            placeholder="e.g. 7"
            value={bidDays}
            onChange={(e) => setBidDays(e.target.value)}
          />
          <Textarea
            label="Message (optional)"
            rows={5}
            placeholder="Explain why you're the best fit for this job..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" fullWidth onClick={() => setBidModalOpen(false)}>
              Cancel
            </Button>
            <Button
              fullWidth
              loading={submitBidMutation.isPending}
              onClick={() => submitBidMutation.mutate()}
              disabled={!bidAmount || !bidDays}
            >
              Submit Bid
            </Button>
          </div>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal open={reviewModalOpen} onClose={() => setReviewModalOpen(false)} title="Leave a Review" size="md">
        <div className="space-y-4">
          {reviewError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{reviewError}</div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Rating</p>
            <StarRating value={reviewRating} size="lg" interactive onChange={setReviewRating} />
          </div>
          <Textarea
            label="Comment (optional)"
            rows={4}
            placeholder="Share your experience working with this provider..."
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" fullWidth onClick={() => setReviewModalOpen(false)}>
              Cancel
            </Button>
            <Button
              fullWidth
              loading={submitReviewMutation.isPending}
              onClick={() => submitReviewMutation.mutate()}
            >
              Submit Review
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Job" size="sm">
        <p className="text-gray-600 mb-4">Are you sure you want to delete this job? This cannot be undone.</p>
        {deleteError && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {deleteError}
          </div>
        )}
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
          <Button variant="danger" fullWidth loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
            Delete Job
          </Button>
        </div>
      </Modal>
    </div>
  );
}
