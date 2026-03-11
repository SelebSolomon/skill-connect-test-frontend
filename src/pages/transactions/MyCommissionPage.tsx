import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { DollarSign, CheckCircle2, Clock, XCircle, BriefcaseBusiness, CreditCard } from 'lucide-react';
import { transactionsApi } from '../../api/transactions.api';
import { useAuthStore } from '../../store/auth.store';
import { Spinner } from '../../components/ui/Spinner';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import type { Transaction, TransactionStatus } from '../../types';

const PAYSTACK_PK = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string;

// Extend window for Paystack inline
declare global {
  interface Window {
    PaystackPop: {
      setup(opts: {
        key: string;
        email: string;
        amount: number; // kobo
        ref: string;
        currency?: string;
        metadata?: Record<string, unknown>;
        onClose: () => void;
        callback: (response: { reference: string }) => void;
      }): { openIframe(): void };
    };
  }
}

// ─── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: TransactionStatus }) {
  if (status === 'paid')
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="w-3 h-3" /> Paid
      </span>
    );
  if (status === 'waived')
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
        <XCircle className="w-3 h-3" /> Waived
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
      <Clock className="w-3 h-3" /> Pending
    </span>
  );
}

// ─── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, amount, color }: { label: string; amount: number; color: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-xl font-bold ${color}`}>₦{amount.toLocaleString()}</p>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export function MyCommissionPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [payingId, setPayingId] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['my-transactions'],
    queryFn: () => transactionsApi.getMy({ limit: 50 }),
  });

  // ─── Auto-verify after Paystack redirect (fallback flow) ────────────────────
  const verifyMutation = useMutation({
    mutationFn: (reference: string) => transactionsApi.verifyPayment(reference),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-transactions'] });
      setSearchParams({});
    },
    onError: () => {
      setVerifyError('Payment verification failed. Contact support if you were charged.');
      setSearchParams({});
    },
  });

  useEffect(() => {
    const ref = searchParams.get('reference') ?? searchParams.get('trxref');
    if (ref && !verifyMutation.isPending) {
      verifyMutation.mutate(ref);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Open Paystack inline popup ─────────────────────────────────────────────
  const initMutation = useMutation({
    mutationFn: (txId: string) => transactionsApi.initializePayment(txId),
    onSuccess: (res, txId) => {
      const tx = data?.transactions.find((t) => t._id === txId);
      if (!tx) return;

      // Use inline popup if PaystackPop is loaded
      if (window.PaystackPop) {
        const handler = window.PaystackPop.setup({
          key: PAYSTACK_PK,
          email: user?.email ?? '',
          amount: Math.round(tx.commissionAmount * 100),
          ref: res.reference,
          currency: 'NGN',
          metadata: { transactionId: txId },
          onClose: () => setPayingId(null),
          callback: (response) => {
            setPayingId(null);
            verifyMutation.mutate(response.reference);
          },
        });
        handler.openIframe();
      } else {
        // Fallback: redirect to checkout page
        window.location.href = res.paymentUrl;
      }
      setPayingId(null);
    },
    onError: () => setPayingId(null),
  });

  const handlePay = (txId: string) => {
    setPayingId(txId);
    initMutation.mutate(txId);
  };

  if (isLoading || verifyMutation.isPending) return <Spinner fullPage />;

  const { transactions = [], balance = { pending: 0, paid: 0, waived: 0 } } = data ?? {};

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">My Commission</h1>
      <p className="text-sm text-gray-500 mb-8">
        SkillLink charges a{' '}
        <span className="font-semibold text-blue-700">5% platform fee</span> on every
        completed job. Pay instantly via card or bank transfer with Paystack.
      </p>

      {verifyError && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {verifyError}
        </div>
      )}

      {/* Balance summary */}
      <Card className="mb-8">
        <div className="flex flex-wrap gap-8 divide-x divide-gray-100">
          <div className="pr-8">
            <StatCard label="Pending (owed)" amount={balance.pending} color="text-amber-600" />
          </div>
          <div className="px-8">
            <StatCard label="Total paid" amount={balance.paid} color="text-green-600" />
          </div>
          <div className="pl-8">
            <StatCard label="Waived" amount={balance.waived} color="text-gray-500" />
          </div>
        </div>

        {balance.pending > 0 && (
          <div className="mt-6 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold mb-1">
              You have ₦{balance.pending.toLocaleString()} outstanding
            </p>
            <p className="text-xs">Pay each job's commission individually below using Paystack.</p>
          </div>
        )}
      </Card>

      {/* Transaction list */}
      {transactions.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No transactions yet. Complete a job to see your commission here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx: Transaction) => {
            const job = typeof tx.jobId === 'object' ? tx.jobId : null;
            const client = typeof tx.clientId === 'object' ? tx.clientId : null;
            const isPaying = payingId === tx._id;

            return (
              <Card key={tx._id}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                    <BriefcaseBusiness className="w-5 h-5 text-blue-700" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {job ? (
                          <Link
                            to={`/jobs/${typeof tx.jobId === 'string' ? tx.jobId : (tx.jobId as any)._id}`}
                            className="hover:text-blue-700 transition-colors"
                          >
                            {job.title}
                          </Link>
                        ) : (
                          'Job'
                        )}
                      </p>
                      <StatusBadge status={tx.status} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Client: {client?.name ?? '—'} ·{' '}
                      {format(new Date(tx.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-900">
                      ₦{tx.commissionAmount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      5% of ₦{tx.agreedPrice.toLocaleString()}
                    </p>
                  </div>
                </div>

                {tx.status === 'paid' && tx.paymentReference && (
                  <p className="text-xs text-green-600 mt-2 pl-14">
                    Ref: {tx.paymentReference}
                  </p>
                )}

                {tx.status === 'pending' && (
                  <div className="mt-3 pl-14">
                    <Button
                      size="sm"
                      loading={isPaying}
                      onClick={() => handlePay(tx._id)}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Pay ₦{tx.commissionAmount.toLocaleString()} with Paystack
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
