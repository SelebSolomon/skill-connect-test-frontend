import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Wallet, ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle2, XCircle, CreditCard } from 'lucide-react';
import { walletApi } from '../../api/wallet.api';
import { Spinner } from '../../components/ui/Spinner';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import type { WalletTransaction, WalletTransactionStatus } from '../../types';

function StatusBadge({ status }: { status: WalletTransactionStatus }) {
  if (status === 'approved') return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
      <CheckCircle2 className="w-3 h-3" /> Approved
    </span>
  );
  if (status === 'rejected') return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
      <XCircle className="w-3 h-3" /> Rejected
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
      <Clock className="w-3 h-3" /> Pending
    </span>
  );
}

export function WalletPage() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [amount, setAmount] = useState('');
  const [showDeposit, setShowDeposit] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: walletApi.getWallet,
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['wallet-history'],
    queryFn: () => walletApi.getHistory({ limit: 30 }),
  });

  // Paystack redirects back with ?verify=1&reference=xxx — auto-verify on landing
  useEffect(() => {
    const shouldVerify = searchParams.get('verify') === '1';
    const reference = searchParams.get('reference');
    if (!shouldVerify || !reference) return;

    // Clean URL so it doesn't re-trigger on refresh
    setSearchParams({}, { replace: true });
    setVerifyStatus('verifying');

    walletApi.verifyDeposit(reference)
      .then(() => {
        setVerifyStatus('success');
        qc.invalidateQueries({ queryKey: ['wallet'] });
        qc.invalidateQueries({ queryKey: ['wallet-history'] });
      })
      .catch(() => setVerifyStatus('error'));
  }, []);

  const initMutation = useMutation({
    mutationFn: () => walletApi.initializeDeposit(Number(amount)),
    onSuccess: ({ paymentUrl }) => {
      // Redirect to Paystack checkout — they handle card/bank transfer/USSD
      window.location.href = paymentUrl;
    },
  });

  if (walletLoading) return <Spinner fullPage />;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">My Wallet</h1>

      {/* Paystack verification result */}
      {verifyStatus === 'verifying' && (
        <div className="mb-4 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 flex items-center gap-3 text-sm text-blue-800">
          <Spinner /> Confirming your payment…
        </div>
      )}
      {verifyStatus === 'success' && (
        <div className="mb-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 flex items-center gap-2 text-sm text-green-800">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> Deposit confirmed! Your wallet has been credited.
        </div>
      )}
      {verifyStatus === 'error' && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          Payment could not be verified. If you were charged, please contact support with your payment reference.
        </div>
      )}

      {/* Balance card */}
      <Card className="mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-blue-700" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Available Balance</p>
            <p className="text-3xl font-black text-gray-900">₦{(wallet?.balance ?? 0).toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400">Commission Owed</p>
            <p className="font-semibold text-amber-600">₦{(wallet?.commissionOwed ?? 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Total Deposited</p>
            <p className="font-semibold text-green-600">₦{(wallet?.totalDeposited ?? 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Total Deducted</p>
            <p className="font-semibold text-gray-600">₦{(wallet?.totalDeducted ?? 0).toLocaleString()}</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <Button size="sm" onClick={() => setShowDeposit((v) => !v)}>
            <CreditCard className="w-4 h-4" />
            Fund Wallet
          </Button>
        </div>
      </Card>

      {/* Paystack deposit form */}
      {showDeposit && (
        <Card className="mb-6 border-2 border-blue-200">
          <h2 className="font-semibold text-gray-900 mb-1">Fund Your Wallet</h2>
          <p className="text-xs text-gray-500 mb-4">
            You'll be redirected to Paystack to complete your payment securely via card, bank transfer, or USSD.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Amount (₦) *</label>
              <input
                type="number"
                min="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {initMutation.isError && (
              <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {(initMutation.error as any)?.response?.data?.message ?? 'Failed to initialize payment'}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                loading={initMutation.isPending}
                disabled={!amount || +amount < 100}
                onClick={() => initMutation.mutate()}
              >
                <CreditCard className="w-3.5 h-3.5" />
                Pay with Paystack
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowDeposit(false); setAmount(''); }}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Transaction history */}
      <h2 className="font-semibold text-gray-900 mb-4">Transaction History</h2>
      {historyLoading ? <Spinner /> : (
        <div className="space-y-3">
          {history?.transactions.length === 0 && (
            <p className="text-center py-12 text-gray-400">No transactions yet.</p>
          )}
          {history?.transactions.map((tx: WalletTransaction) => (
            <Card key={tx._id}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    tx.type === 'deposit' ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    {tx.type === 'deposit'
                      ? <ArrowDownCircle className="w-4 h-4 text-green-600" />
                      : <ArrowUpCircle className="w-4 h-4 text-red-500" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 capitalize">{tx.type}</p>
                    <p className="text-xs text-gray-400">
                      {tx.createdAt ? format(new Date(tx.createdAt), 'MMM d, yyyy') : '—'}
                      {tx.note && ` · ${tx.note}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${tx.type === 'deposit' ? 'text-green-600' : 'text-red-500'}`}>
                    {tx.type === 'deposit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                  </p>
                  <StatusBadge status={tx.status} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
