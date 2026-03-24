import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DollarSign, Clock, Calendar, UserCheck, User, MessageSquare } from 'lucide-react';
import { Card } from '../ui/Card';
import { bidStatusBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { format } from 'date-fns';
import type { Bid, Job, User as UserType } from '../../types';
import { conversationsApi } from '../../api/conversations.api';

interface BidCardProps {
  bid: Bid;
  showJob?: boolean;
  onAssign?: (bid: Bid) => void;
  isAssigning?: boolean;
}

export function BidCard({ bid, showJob = true, onAssign, isAssigning }: BidCardProps) {
  const navigate = useNavigate();
  const job = bid.jobId as Job | undefined;
  const provider = typeof bid.providerId === 'object' ? (bid.providerId as UserType) : null;
  const providerId = provider?._id ?? (bid.providerId as string);
  const canAssign = !!onAssign && bid.status === 'pending';
  const [chatLoading, setChatLoading] = useState(false);

  async function handleChat() {
    if (!providerId) return;
    setChatLoading(true);
    try {
      const jobId = typeof bid.jobId === 'object' ? (bid.jobId as Job)._id : bid.jobId;
      const { data } = await conversationsApi.startConversation({ recipientId: providerId, jobId });
      navigate(`/conversations?id=${data._id}`);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      {/* Provider info row */}
      {provider && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {provider.name?.charAt(0).toUpperCase() ?? 'P'}
            </div>
            <span className="text-sm font-medium text-gray-900 truncate">{provider.name}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link to={`/providers/${providerId}`}>
              <Button size="sm" variant="outline">
                <User className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">View Profile</span>
                <span className="xs:hidden">Profile</span>
              </Button>
            </Link>
            <Button size="sm" variant="outline" loading={chatLoading} onClick={handleChat}>
              <MessageSquare className="w-3.5 h-3.5" />
              Chat
            </Button>
          </div>
        </div>
      )}

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
