import { useQuery } from '@tanstack/react-query';
import {
  Briefcase, Star, DollarSign, TrendingUp, CheckCircle2, ShieldCheck,
} from 'lucide-react';
import { analyticsApi } from '../../api/analytics.api';
import { useAuthStore } from '../../store/auth.store';
import { Spinner } from '../../components/ui/Spinner';
import { Card } from '../../components/ui/Card';
import { StarRating } from '../../components/ui/StarRating';

function StatCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card>
      <div className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </div>
    </Card>
  );
}

// ─── Provider ──────────────────────────────────────────────────────────────────
function ProviderAnalytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics-provider'],
    queryFn: analyticsApi.getProviderStats,
  });

  if (isLoading) return <Spinner />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Earnings"
          value={`₦${data.totalEarnings.toLocaleString()}`}
          icon={<DollarSign className="w-5 h-5 text-green-600" />}
          color="bg-green-50"
        />
        <StatCard
          label="Total Jobs"
          value={data.totalJobs}
          sub={`${data.activeJobs} active`}
          icon={<Briefcase className="w-5 h-5 text-blue-700" />}
          color="bg-blue-50"
        />
        <StatCard
          label="Completion Rate"
          value={`${data.completionRate}%`}
          sub={`${data.completedJobs} completed`}
          icon={<CheckCircle2 className="w-5 h-5 text-blue-700" />}
          color="bg-blue-50"
        />
        <StatCard
          label="Reviews"
          value={data.totalReviews}
          icon={<Star className="w-5 h-5 text-amber-500" />}
          color="bg-amber-50"
        />
        <StatCard
          label="Verification"
          value={data.isVerified ? 'Verified' : 'Unverified'}
          icon={<ShieldCheck className={`w-5 h-5 ${data.isVerified ? 'text-green-600' : 'text-gray-400'}`} />}
          color={data.isVerified ? 'bg-green-50' : 'bg-gray-50'}
        />
      </div>

      {/* Rating */}
      {data.totalReviews > 0 && (
        <Card>
          <h2 className="font-semibold text-gray-900 mb-3">Average Rating</h2>
          <div className="flex items-center gap-4">
            <p className="text-5xl font-black text-gray-900">{data.averageRating.toFixed(1)}</p>
            <div>
              <StarRating value={data.averageRating} size="md" />
              <p className="text-sm text-gray-500 mt-1">Based on {data.totalReviews} review{data.totalReviews !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Client ────────────────────────────────────────────────────────────────────
function ClientAnalytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics-client'],
    queryFn: analyticsApi.getClientStats,
  });

  if (isLoading) return <Spinner />;
  if (!data) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
      <StatCard
        label="Jobs Posted"
        value={data.totalJobsPosted}
        sub={`${data.activeJobs} currently active`}
        icon={<Briefcase className="w-5 h-5 text-blue-700" />}
        color="bg-blue-50"
      />
      <StatCard
        label="Completed Jobs"
        value={data.completedJobs}
        icon={<CheckCircle2 className="w-5 h-5 text-green-600" />}
        color="bg-green-50"
      />
      <StatCard
        label="Total Spent"
        value={`₦${data.totalSpent.toLocaleString()}`}
        icon={<DollarSign className="w-5 h-5 text-blue-700" />}
        color="bg-blue-50"
      />
      <StatCard
        label="Completion Rate"
        value={data.totalJobsPosted > 0 ? `${Math.round((data.completedJobs / data.totalJobsPosted) * 100)}%` : '—'}
        icon={<TrendingUp className="w-5 h-5 text-amber-500" />}
        color="bg-amber-50"
      />
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export function AnalyticsPage() {
  const { user } = useAuthStore();

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Analytics</h1>
      {user?.role === 'provider' ? <ProviderAnalytics /> : <ClientAnalytics />}
    </div>
  );
}
