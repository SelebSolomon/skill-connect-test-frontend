import { Link } from 'react-router-dom';
import { DollarSign, Clock, Calendar, UserCheck } from 'lucide-react';
import { Card } from '../ui/Card';
import { bidStatusBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { format } from 'date-fns';
import type { Bid, Job } from '../../types';

interface BidCardProps {
  bid: Bid;
  showJob?: boolean;
  onAssign?: (bid: Bid) => void;
  isAssigning?: boolean;
}

export function BidCard({ bid, showJob = true, onAssign, isAssigning }: BidCardProps) {
  const job = bid.jobId as Job | undefined;
  const canAssign = !!onAssign && bid.status === 'pending';

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {showJob && job && typeof job === 'object' && (
            <Link
              to={`/jobs/${job._id}`}
              className="font-semibold text-gray-900 hover:text-blue-700 transition-colors truncate block text-base"
            >
              {job.title}
            </Link>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm">
            <span className="flex items-center gap-1 text-green-600 font-semibold">
              <DollarSign className="w-4 h-4" />
              ₦{bid.proposedPrice?.toLocaleString()}
            </span>
            <span className="flex items-center gap-1 text-gray-500">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              {bid.estimatedDuration} days delivery
            </span>
          </div>
        </div>
        {bidStatusBadge(bid.status)}
      </div>

      {bid.message && (
        <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed bg-gray-50 rounded-xl px-3 py-2">
          {bid.message}
        </p>
      )}

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
        <div className="text-xs text-gray-400 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          Submitted {format(new Date(bid.createdAt), 'MMM d, yyyy')}
        </div>
        {canAssign && (
          <Button size="sm" loading={isAssigning} onClick={() => onAssign(bid)}>
            <UserCheck className="w-4 h-4" />
            Assign Provider
          </Button>
        )}
      </div>
    </Card>
  );
}
