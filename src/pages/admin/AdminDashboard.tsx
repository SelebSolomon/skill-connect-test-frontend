import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Users, Briefcase, DollarSign, Flag, ShieldCheck, ShieldOff,
  Ban, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { adminApi } from '../../api/admin.api';
import { Spinner } from '../../components/ui/Spinner';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import type { AdminUser, ReportStatus } from '../../types';

// ─── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
        </div>
      </div>
    </Card>
  );
}

// ─── Users tab ─────────────────────────────────────────────────────────────────
function UsersTab() {
  const [search, setSearch] = useState('');
  const [roleName, setRoleName] = useState('');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', { search, roleName, page }],
    queryFn: () => adminApi.getUsers({ search: search || undefined, roleName: roleName || undefined, page, limit: 15 }),
  });

  const banMutation = useMutation({
    mutationFn: ({ userId, banned }: { userId: string; banned: boolean }) =>
      adminApi.banUser(userId, banned),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ userId, verified }: { userId: string; verified: boolean }) =>
      adminApi.verifyProvider(userId, verified),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 min-w-48 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <select
          value={roleName}
          onChange={(e) => { setRoleName(e.target.value); setPage(1); }}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="">All roles</option>
          <option value="client">Client</option>
          <option value="provider">Provider</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {isLoading ? <Spinner /> : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.users.map((u: AdminUser) => (
                  <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-xs font-medium bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full">
                        {u.roleName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.banned ? (
                        <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Banned</span>
                      ) : (
                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {u.createdAt ? format(new Date(u.createdAt), 'MMM d, yyyy') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => banMutation.mutate({ userId: u._id, banned: !u.banned })}
                          className={`text-xs px-2 py-1 rounded-lg font-medium transition-colors ${
                            u.banned
                              ? 'bg-green-50 text-green-700 hover:bg-green-100'
                              : 'bg-red-50 text-red-600 hover:bg-red-100'
                          }`}
                        >
                          {u.banned ? 'Unban' : 'Ban'}
                        </button>
                        {u.roleName === 'provider' && (
                          <button
                            onClick={() => verifyMutation.mutate({ userId: u._id, verified: true })}
                            className="text-xs px-2 py-1 rounded-lg font-medium bg-blue-50 text-blue-800 hover:bg-blue-100 transition-colors"
                          >
                            Verify
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Page {data.page} of {data.totalPages} · {data.total} users</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button variant="ghost" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Reports tab ───────────────────────────────────────────────────────────────
function ReportsTab() {
  const [statusFilter, setStatusFilter] = useState<ReportStatus | ''>('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports', { statusFilter, page }],
    queryFn: () => adminApi.getReports({ status: (statusFilter || undefined) as ReportStatus | undefined, page, limit: 10 }),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ reportId, status, notes }: { reportId: string; status: 'reviewed' | 'dismissed' | 'actioned'; notes?: string }) =>
      adminApi.resolveReport(reportId, status, notes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-reports'] }),
  });

  const statusBadge = (s: ReportStatus) => {
    const map: Record<ReportStatus, string> = {
      pending: 'bg-amber-50 text-amber-700',
      reviewed: 'bg-blue-50 text-blue-700',
      dismissed: 'bg-gray-100 text-gray-500',
      actioned: 'bg-green-50 text-green-700',
    };
    return <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${map[s]}`}>{s}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as ReportStatus | ''); setPage(1); }}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="dismissed">Dismissed</option>
          <option value="actioned">Actioned</option>
        </select>
      </div>

      {isLoading ? <Spinner /> : (
        <div className="space-y-3">
          {data?.reports.length === 0 && (
            <p className="text-center py-12 text-gray-400">No reports found.</p>
          )}
          {data?.reports.map((r) => {
            const reporter = typeof r.reporterId === 'object' ? r.reporterId : null;
            const isExpanded = expandedId === r._id;
            return (
              <Card key={r._id}>
                <div
                  className="flex items-start justify-between gap-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : r._id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {statusBadge(r.status)}
                      <span className="text-xs text-gray-400 capitalize">{r.targetType} · {r.reason}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      By {reporter?.name ?? 'Unknown'} · {r.createdAt ? format(new Date(r.createdAt), 'MMM d, yyyy') : '—'}
                    </p>
                    {r.description && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{r.description}</p>}
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                </div>

                {isExpanded && r.status === 'pending' && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                    <Button size="sm" variant="ghost"
                      onClick={() => resolveMutation.mutate({ reportId: r._id, status: 'reviewed' })}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark Reviewed
                    </Button>
                    <Button size="sm" variant="ghost"
                      onClick={() => resolveMutation.mutate({ reportId: r._id, status: 'dismissed' })}
                    >
                      Dismiss
                    </Button>
                    <Button size="sm"
                      onClick={() => resolveMutation.mutate({ reportId: r._id, status: 'actioned' })}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" /> Take Action
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Page {data.page} of {data.totalPages}</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <Button variant="ghost" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Deposits tab ──────────────────────────────────────────────────────────────
function DepositsTab() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-deposits'],
    queryFn: () => adminApi.getPendingDeposits({ limit: 20 }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi.approveDeposit(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-deposits'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => adminApi.rejectDeposit(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-deposits'] }),
  });

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-3">
      {data?.deposits.length === 0 && (
        <p className="text-center py-12 text-gray-400">No pending deposits.</p>
      )}
      {data?.deposits.map((d) => {
        const owner = typeof d.userId === 'object' ? d.userId : null;
        return (
          <Card key={d._id}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-gray-900 text-sm">{owner?.name ?? 'Provider'}</p>
                <p className="text-xs text-gray-400">{owner?.email} · ₦{d.amount.toLocaleString()}</p>
                {d.note && <p className="text-xs text-gray-500 mt-1">{d.note}</p>}
                {d.proofImageUrl && (
                  <a href={d.proofImageUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-700 hover:underline mt-1 block">
                    View proof image
                  </a>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" loading={approveMutation.isPending} onClick={() => approveMutation.mutate(d._id)}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                </Button>
                <Button size="sm" variant="ghost" onClick={() => rejectMutation.mutate(d._id)}>
                  Reject
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
type Tab = 'users' | 'reports' | 'deposits';

export function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('users');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.getStats,
    staleTime: 30_000,
  });

  const tabs: { id: Tab; label: string }[] = [
    { id: 'users', label: 'Users' },
    { id: 'reports', label: 'Reports' },
    { id: 'deposits', label: 'Deposits' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      {/* Stats */}
      {statsLoading ? <Spinner /> : stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
          <StatCard label="Total Users" value={stats.totalUsers} icon={<Users className="w-5 h-5 text-blue-700" />} color="bg-blue-50" />
          <StatCard label="Total Jobs" value={stats.totalJobs} icon={<Briefcase className="w-5 h-5 text-blue-700" />} color="bg-blue-50" />
          <StatCard label="Active Providers" value={stats.activeProviders} icon={<ShieldCheck className="w-5 h-5 text-green-600" />} color="bg-green-50" />
          <StatCard label="Revenue (NGN)" value={stats.totalRevenue} icon={<DollarSign className="w-5 h-5 text-amber-600" />} color="bg-amber-50" />
          <StatCard label="Pending Reports" value={stats.pendingReports} icon={<Flag className="w-5 h-5 text-red-500" />} color="bg-red-50" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              tab === t.id
                ? 'text-blue-800 border-b-2 border-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'users' && <UsersTab />}
      {tab === 'reports' && <ReportsTab />}
      {tab === 'deposits' && <DepositsTab />}
    </div>
  );
}
