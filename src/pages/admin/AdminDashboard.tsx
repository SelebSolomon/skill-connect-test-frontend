import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Users, Briefcase, DollarSign, Flag, ShieldCheck, ShieldOff,
  Ban, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, Wrench, Plus, Pencil, Trash2, X,
  Receipt, ExternalLink,
} from 'lucide-react';
import { adminApi } from '../../api/admin.api';
import { servicesApi } from '../../api/services.api';
import { transactionsApi } from '../../api/transactions.api';
import type { Transaction } from '../../types';
import type { Service } from '../../types';
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
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-100">
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
                    <td className="px-4 py-3 text-gray-500 max-w-[160px] truncate">{u.email}</td>
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

          {/* Mobile card list */}
          <div className="md:hidden space-y-3">
            {data?.users.map((u: AdminUser) => (
              <div key={u._id} className="rounded-xl border border-gray-100 bg-white p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{u.name}</p>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="capitalize text-xs font-medium bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full">{u.roleName}</span>
                    {u.banned ? (
                      <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Banned</span>
                    ) : (
                      <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Active</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Joined {u.createdAt ? format(new Date(u.createdAt), 'MMM d, yyyy') : '—'}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => banMutation.mutate({ userId: u._id, banned: !u.banned })}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
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
                        className="px-2.5 py-1 rounded-lg font-medium bg-blue-50 text-blue-800 hover:bg-blue-100 transition-colors"
                      >
                        Verify
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
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

// ─── Services tab ──────────────────────────────────────────────────────────────
function ServicesTab() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ['admin-services'],
    queryFn: servicesApi.getAllAdmin,
  });

  const openCreate = () => {
    setEditingService(null);
    setName(''); setCategory(''); setDescription(''); setFormError('');
    setShowForm(true);
  };

  const openEdit = (s: Service) => {
    setEditingService(s);
    setName(s.name); setCategory(s.category); setDescription(s.description ?? ''); setFormError('');
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setFormError(''); };

  const saveMutation = useMutation({
    mutationFn: () =>
      editingService
        ? servicesApi.update(editingService._id, { name, category, description: description || undefined })
        : servicesApi.create({ name, category, description: description || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-services'] });
      qc.invalidateQueries({ queryKey: ['services'] });
      closeForm();
    },
    onError: (err: any) => setFormError(err?.response?.data?.message ?? 'Failed to save'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => servicesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-services'] });
      qc.invalidateQueries({ queryKey: ['services'] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (s: Service) => servicesApi.update(s._id, { isActive: !s.isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-services'] }),
  });

  const seedMutation = useMutation({
    mutationFn: servicesApi.seed,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-services'] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">{services.length} service{services.length !== 1 ? 's' : ''}</p>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" loading={seedMutation.isPending} onClick={() => seedMutation.mutate()}>
            Seed defaults
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="w-3.5 h-3.5" /> New service
          </Button>
        </div>
      </div>

      {isLoading ? <Spinner /> : (
        <div className="space-y-2">
          {services.length === 0 && (
            <p className="text-center py-12 text-gray-400">No services yet.</p>
          )}
          {services.map((s) => (
            <Card key={s._id}>
              <div className="flex items-center gap-3">
                <Wrench className="w-4 h-4 text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{s.name}</p>
                  <p className="text-xs text-gray-400">{s.category}{s.description ? ` · ${s.description}` : ''}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {s.isActive ? 'Active' : 'Inactive'}
                </span>
                <button
                  onClick={() => toggleMutation.mutate(s)}
                  className="text-xs px-2 py-1 rounded-lg font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  {s.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-700 hover:bg-blue-50 transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { if (confirm(`Delete "${s.name}"?`)) deleteMutation.mutate(s._id); }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{editingService ? 'Edit Service' : 'New Service'}</h3>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            {formError && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</div>
            )}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Name *</label>
                <input
                  value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Plumbing"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Category *</label>
                <input
                  value={category} onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Home Repair"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Description</label>
                <textarea
                  rows={2} value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional short description"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={closeForm} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button
                disabled={!name || !category || saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
                className="flex-1 py-2 rounded-xl bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-50 transition-colors"
              >
                {saveMutation.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Transactions tab ──────────────────────────────────────────────────────────
function TransactionsTab() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [payRef, setPayRef] = useState('');
  const [waiveReason, setWaiveReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-transactions', { statusFilter, page }],
    queryFn: () => transactionsApi.getAll({ status: statusFilter || undefined, page, limit: 15 }),
  });

  const { data: summary } = useQuery({
    queryKey: ['admin-tx-summary'],
    queryFn: transactionsApi.getSummary,
  });

  const markPaidMutation = useMutation({
    mutationFn: ({ id, ref }: { id: string; ref?: string }) => transactionsApi.markAsPaid(id, ref),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-transactions'] });
      qc.invalidateQueries({ queryKey: ['admin-tx-summary'] });
      setExpandedId(null);
      setPayRef('');
    },
  });

  const waiveMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => transactionsApi.waive(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-transactions'] });
      qc.invalidateQueries({ queryKey: ['admin-tx-summary'] });
      setExpandedId(null);
      setWaiveReason('');
    },
  });

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      pending: 'bg-amber-50 text-amber-700',
      paid:    'bg-green-50 text-green-700',
      waived:  'bg-gray-100 text-gray-500',
    };
    return (
      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${map[s] ?? 'bg-gray-100 text-gray-500'}`}>
        {s}
      </span>
    );
  };

  function txProvider(t: Transaction) {
    return typeof t.providerId === 'object' ? t.providerId : null;
  }
  function txClient(t: Transaction) {
    return typeof t.clientId === 'object' ? t.clientId : null;
  }
  function txJob(t: Transaction) {
    return typeof t.jobId === 'object' ? t.jobId : null;
  }

  return (
    <div className="space-y-5">
      {/* Summary strip */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total GMV', value: summary.totalGMV },
            { label: 'Total Commission', value: summary.totalCommission },
            { label: 'Pending', value: summary.pendingCommission },
            { label: 'Paid', value: summary.paidCommission },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-gray-100 bg-white px-4 py-3">
              <p className="text-xs text-gray-400">{label}</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">₦{value.toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="waived">Waived</option>
        </select>
        <span className="self-center text-sm text-gray-400">{data?.total ?? 0} transactions</span>
      </div>

      {isLoading ? <Spinner /> : (
        <div className="space-y-3">
          {data?.transactions.length === 0 && (
            <p className="text-center py-12 text-gray-400">No transactions found.</p>
          )}

          {data?.transactions.map((t) => {
            const provider = txProvider(t);
            const client = txClient(t);
            const job = txJob(t);
            const isExpanded = expandedId === t._id;

            return (
              <Card key={t._id}>
                {/* Row summary */}
                <div
                  className="flex items-start justify-between gap-4 cursor-pointer"
                  onClick={() => { setExpandedId(isExpanded ? null : t._id); setPayRef(''); setWaiveReason(''); }}
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {statusBadge(t.status)}
                      <span className="text-xs text-gray-400">
                        {t.createdAt ? format(new Date(t.createdAt), 'MMM d, yyyy · h:mm a') : '—'}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {provider?.name ?? 'Provider'} → Commission due: ₦{t.commissionAmount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      Job: <span className="font-medium text-gray-700">{job?.title ?? '—'}</span>
                      &nbsp;·&nbsp;Agreed price: ₦{t.agreedPrice.toLocaleString()}
                      &nbsp;·&nbsp;Rate: {(t.commissionRate * 100).toFixed(0)}%
                    </p>
                  </div>
                  {isExpanded
                    ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                    {/* Parties */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-xl bg-gray-50 px-4 py-3 space-y-1">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Provider</p>
                        <p className="text-sm font-semibold text-gray-900">{provider?.name ?? '—'}</p>
                        <p className="text-xs text-gray-500">{provider?.email ?? '—'}</p>
                      </div>
                      <div className="rounded-xl bg-gray-50 px-4 py-3 space-y-1">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Client</p>
                        <p className="text-sm font-semibold text-gray-900">{client?.name ?? '—'}</p>
                        <p className="text-xs text-gray-500">{client?.email ?? '—'}</p>
                      </div>
                    </div>

                    {/* Job & financials */}
                    <div className="rounded-xl bg-gray-50 px-4 py-3 space-y-2">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Job Details</p>
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                        <div>
                          <span className="text-gray-400 text-xs">Title</span>
                          <p className="font-medium text-gray-900">{job?.title ?? '—'}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-xs">Agreed Price</span>
                          <p className="font-bold text-gray-900">₦{t.agreedPrice.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-xs">Commission ({(t.commissionRate * 100).toFixed(0)}%)</span>
                          <p className="font-bold text-blue-700">₦{t.commissionAmount.toLocaleString()}</p>
                        </div>
                      </div>
                      {job?._id && (
                        <a
                          href={`/jobs/${job._id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-700 hover:underline mt-1"
                        >
                          <ExternalLink className="w-3 h-3" /> View Job
                        </a>
                      )}
                    </div>

                    {/* Payment info */}
                    {t.status === 'paid' && (
                      <div className="rounded-xl bg-green-50 border border-green-100 px-4 py-3 space-y-1">
                        <p className="text-[11px] font-semibold text-green-700 uppercase tracking-wide">Payment Confirmed</p>
                        {t.paymentReference && (
                          <p className="text-xs text-gray-700">Reference: <span className="font-mono font-medium">{t.paymentReference}</span></p>
                        )}
                        {t.paidAt && (
                          <p className="text-xs text-gray-500">Paid on {format(new Date(t.paidAt), 'MMM d, yyyy · h:mm a')}</p>
                        )}
                      </div>
                    )}

                    {t.status === 'waived' && (
                      <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 space-y-1">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Waived</p>
                        {t.waivedReason && <p className="text-xs text-gray-600">Reason: {t.waivedReason}</p>}
                        {t.waivedAt && <p className="text-xs text-gray-400">{format(new Date(t.waivedAt), 'MMM d, yyyy')}</p>}
                      </div>
                    )}

                    {/* Pending actions */}
                    {t.status === 'pending' && (
                      <div className="space-y-3">
                        {/* Mark as paid */}
                        <div className="rounded-xl border border-gray-200 px-4 py-3 space-y-2">
                          <p className="text-xs font-semibold text-gray-600">Mark as Paid</p>
                          <input
                            type="text"
                            value={payRef}
                            onChange={(e) => setPayRef(e.target.value)}
                            placeholder="Payment reference (optional)"
                            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                          />
                          <Button
                            size="sm"
                            loading={markPaidMutation.isPending}
                            onClick={() => markPaidMutation.mutate({ id: t._id, ref: payRef || undefined })}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Payment
                          </Button>
                        </div>

                        {/* Waive */}
                        <div className="rounded-xl border border-gray-200 px-4 py-3 space-y-2">
                          <p className="text-xs font-semibold text-gray-600">Waive Commission</p>
                          <input
                            type="text"
                            value={waiveReason}
                            onChange={(e) => setWaiveReason(e.target.value)}
                            placeholder="Reason for waiving (optional)"
                            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            loading={waiveMutation.isPending}
                            onClick={() => waiveMutation.mutate({ id: t._id, reason: waiveReason || undefined })}
                          >
                            Waive
                          </Button>
                        </div>
                      </div>
                    )}
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

// ─── Page ──────────────────────────────────────────────────────────────────────
type Tab = 'users' | 'reports' | 'deposits' | 'services' | 'transactions';

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
    { id: 'transactions', label: 'Transactions' },
    { id: 'services', label: 'Services' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      {/* Stats */}
      {statsLoading ? <Spinner /> : stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-8 sm:mb-10">
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
      {tab === 'transactions' && <TransactionsTab />}
      {tab === 'services' && <ServicesTab />}
    </div>
  );
}
