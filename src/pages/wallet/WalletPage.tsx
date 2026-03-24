import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Wallet, Upload, ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle2, XCircle } from 'lucide-react';
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
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [showDeposit, setShowDeposit] = useState(false);

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: walletApi.getWallet,
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['wallet-history'],
    queryFn: () => walletApi.getHistory({ limit: 30 }),
  });

  const depositMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('amount', amount);
      if (note) fd.append('note', note);
      if (proofFile) fd.append('proofImage', proofFile);
      return walletApi.requestDeposit(fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallet-history'] });
      setAmount('');
      setNote('');
      setProofFile(null);
      setShowDeposit(false);
    },
  });

  if (walletLoading) return <Spinner fullPage />;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">My Wallet</h1>

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
            <Upload className="w-4 h-4" />
            Request Deposit
          </Button>
        </div>
      </Card>

      {/* Deposit form */}
      {showDeposit && (
        <Card className="mb-6 border-2 border-blue-200">
          <h2 className="font-semibold text-gray-900 mb-4">New Deposit Request</h2>
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
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Note (optional)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Bank transfer via GTBank"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Payment proof (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  if (file && file.size > 5 * 1024 * 1024) { alert('Proof image must be under 5 MB'); return; }
                  setProofFile(file);
                }}
                className="w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-800 file:px-3 file:py-1.5 file:text-xs file:font-medium hover:file:bg-blue-100"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                loading={depositMutation.isPending}
                disabled={!amount || +amount < 100}
                onClick={() => depositMutation.mutate()}
              >
                Submit Request
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowDeposit(false)}>
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
