import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Gavel, Pencil, Briefcase, CheckCircle2, XCircle } from 'lucide-react';
import { bidsApi, type UpdateBidDto } from '../../api/bids.api';
import { BidCard } from '../../components/shared/BidCard';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useState } from 'react';
import { getErrorMessage } from '../../hooks/useErrorMessage';
import type { Bid, Job } from '../../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getJobStatus(bid: Bid): string | null {
  return typeof bid.jobId === 'object' ? (bid.jobId as Job).status : null;
}

// ─── Status banner shown below a BidCard ─────────────────────────────────────
function BidStatusBanner({ bid }: { bid: Bid }) {
  const jobStatus = getJobStatus(bid);

  // Provider's bid was accepted → they got the job
  if (bid.status === 'accepted') {
    if (jobStatus === 'completed') {
      return (
        <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 border border-green-200 text-sm text-green-700 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Job completed — well done!
        </div>
      );
    }
    // in_progress or any other state after acceptance
    return (
      <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-700 font-medium">
        <Briefcase className="w-4 h-4 shrink-0" />
        You're working on this job
      </div>
    );
  }

  // Bid was rejected (another provider was chosen)
  if (bid.status === 'rejected') {
    return (
      <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-500">
        <XCircle className="w-4 h-4 shrink-0" />
        Another provider was selected for this job
      </div>
    );
  }

  // Bid is still pending but job is no longer open (edge case)
  if (bid.status === 'pending' && jobStatus && jobStatus !== 'open') {
    return (
      <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700">
        <Briefcase className="w-4 h-4 shrink-0" />
        This job is no longer accepting bids
      </div>
    );
  }

  return null;
}

// ─── Edit Bid Form ────────────────────────────────────────────────────────────
function EditBidModal({ bid, onClose }: { bid: Bid; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [price, setPrice] = useState(String(bid.proposedPrice));
  const [duration, setDuration] = useState(String(bid.estimatedDuration));
  const [message, setMessage] = useState(bid.message ?? '');
  const [error, setError] = useState('');

  const updateMutation = useMutation({
    mutationFn: (dto: UpdateBidDto) => bidsApi.updateBid(bid._id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bids'] });
      onClose();
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const parsedPrice = Number(price);
    const parsedDuration = Number(duration);

    if (!parsedPrice || parsedPrice <= 0) {
      setError('Proposed price must be a positive number');
      return;
    }
    if (!parsedDuration || parsedDuration < 1) {
      setError('Estimated duration must be at least 1 day');
      return;
    }

    const dto: UpdateBidDto = {};
    if (parsedPrice !== bid.proposedPrice) dto.proposedPrice = parsedPrice;
    if (parsedDuration !== bid.estimatedDuration) dto.estimatedDuration = parsedDuration;
    if (message.trim() !== (bid.message ?? '')) dto.message = message.trim();

    if (Object.keys(dto).length === 0) {
      setError('No changes detected');
      return;
    }

    updateMutation.mutate(dto);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Proposed Price (₦)</label>
        <input
          type="number"
          min={1}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Duration (days)</label>
        <input
          type="number"
          min={1}
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Message (optional)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          maxLength={1000}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <p className="text-xs text-gray-400 mt-1 text-right">{message.length}/1000</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="flex gap-3 pt-1">
        <Button type="button" variant="outline" fullWidth onClick={onClose}>Cancel</Button>
        <Button type="submit" fullWidth loading={updateMutation.isPending}>Save Changes</Button>
      </div>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function MyBidsPage() {
  const queryClient = useQueryClient();
  const [withdrawId, setWithdrawId] = useState<string | null>(null);
  const [editBid, setEditBid] = useState<Bid | null>(null);
  const [withdrawError, setWithdrawError] = useState('');

  const { data: bids, isLoading } = useQuery({
    queryKey: ['my-bids'],
    queryFn: bidsApi.getMyBids,
  });

  const withdrawMutation = useMutation({
    mutationFn: (id: string) => bidsApi.withdrawBid(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bids'] });
      setWithdrawId(null);
    },
    onError: (err) => setWithdrawError(getErrorMessage(err)),
  });

  if (isLoading) return <Spinner fullPage />;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Bids</h1>
        <p className="text-gray-500 mt-1">{bids?.length ?? 0} bids submitted</p>
      </div>

      {(bids ?? []).length === 0 ? (
        <div className="text-center py-20">
          <Gavel className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No bids yet</h3>
          <p className="text-gray-500 mt-1">Browse open jobs and submit your first bid</p>
          <Button className="mt-4" onClick={() => (window.location.href = '/jobs')}>
            Browse Jobs
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {(bids ?? []).map((bid) => {
            const jobStatus = getJobStatus(bid);
            // Only allow edit/withdraw when the bid is pending AND the job is still open
            const canModify = bid.status === 'pending' && jobStatus === 'open';

            return (
              <div key={bid._id}>
                <BidCard bid={bid} />
                <BidStatusBanner bid={bid} />
                {canModify && (
                  <div className="mt-2 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditBid(bid)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit Bid
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => { setWithdrawError(''); setWithdrawId(bid._id); }}
                    >
                      Withdraw Bid
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      <Modal open={!!editBid} onClose={() => setEditBid(null)} title="Edit Bid" size="md">
        {editBid && <EditBidModal bid={editBid} onClose={() => setEditBid(null)} />}
      </Modal>

      {/* Withdraw Confirmation Modal */}
      <Modal open={!!withdrawId} onClose={() => setWithdrawId(null)} title="Withdraw Bid" size="sm">
        <p className="text-gray-600 mb-6">Are you sure you want to withdraw this bid?</p>
        {withdrawError && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {withdrawError}
          </div>
        )}
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={() => setWithdrawId(null)}>Cancel</Button>
          <Button
            variant="danger"
            fullWidth
            loading={withdrawMutation.isPending}
            onClick={() => withdrawId && withdrawMutation.mutate(withdrawId)}
          >
            Withdraw
          </Button>
        </div>
      </Modal>
    </div>
  );
}
