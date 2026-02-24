import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import api from '../configs/axios';
import { Receipt, Clock, CheckCircle, XCircle, Download, CreditCard, Coins, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Billing = () => {
    const { getToken } = useAuth();
    const { user } = useUser();
    const [transactions, setTransactions] = useState([]);
    const [credits, setCredits] = useState(0);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = await getToken();

                // Fetch Transactions
                const { data: txData } = await api.get('/api/payment/transactions', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTransactions(txData.transactions);

                // Fetch Credits
                const { data: userData } = await api.get('/api/user/credits', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCredits(userData.credits);

            } catch (error) {
                toast.error("Failed to load billing details");
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchData();
    }, [user, getToken]);

    const handleDownloadReceipt = async (transactionId, orderId) => {
        try {
            setDownloadingId(transactionId);
            const token = await getToken();

            const response = await api.get(`/api/payment/receipt/${transactionId}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            // Create a blob from the response data
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);

            // Create a temporary link and trigger download
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `receipt_${orderId}.pdf`);
            document.body.appendChild(link);
            link.click();

            // Cleanup
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success("Receipt downloaded successfully");
        } catch (error) {
            console.error("Download Error:", error);
            toast.error("Failed to download receipt");
        } finally {
            setDownloadingId(null);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'success': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'failed': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'success': return <CheckCircle size={14} />;
            case 'failed': return <XCircle size={14} />;
            default: return <Clock size={14} />;
        }
    };

    return (
        <div className="min-h-screen text-white pt-32 pb-20 px-6">
            <div className="max-w-5xl mx-auto">
                <header className="mb-12">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-indigo-600/20 rounded-2xl text-indigo-400">
                            <Receipt size={32} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight">Billing & Receipts</h1>
                            <p className="text-gray-400 mt-1">Manage your subscriptions and view transaction history</p>
                        </div>
                    </div>
                </header>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Summary Cards */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-white/[0.02]">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6 block">Account Balance</h3>
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-yellow-500/10 rounded-2xl text-yellow-500">
                                    <Coins size={24} />
                                </div>
                                <div>
                                    <span className="text-3xl font-bold block">{credits} Credits</span>
                                    <span className="text-indigo-400 font-bold text-lg uppercase tracking-tighter">Available Balance</span>
                                </div>
                            </div>
                            <button
                                onClick={() => window.location.href = '/plans'}
                                className="w-full mt-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 transition-all font-bold flex items-center justify-center gap-2"
                            >
                                <CreditCard size={18} /> Buy More Credits
                            </button>
                        </div>

                        <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-white/[0.02]">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Need Help?</h3>
                            <p className="text-sm text-gray-400 mb-6 leading-relaxed">If you have any issues with your payments or credits, please contact our support team.</p>
                            <a href="mailto:manojadalchemist@gmail.com" className="text-indigo-400 font-bold hover:underline">manojadalchemist@gmail.com</a>
                        </div>
                    </div>

                    {/* Transaction Table */}
                    <div className="lg:col-span-2">
                        <div className="glass-panel rounded-3xl border border-white/10 bg-white/[0.02] overflow-hidden">
                            <div className="p-6 border-b border-white/5 flex justify-between items-center">
                                <h3 className="font-bold text-lg">Transaction History</h3>
                                <span className="text-xs font-bold text-gray-500 uppercase px-3 py-1 bg-white/5 rounded-full">
                                    {transactions.length} Total
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white/[0.01]">
                                            <th className="px-6 py-4">Transaction ID / Date</th>
                                            <th className="px-6 py-4">Plan</th>
                                            <th className="px-6 py-4">Amount</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right">Receipt</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {loading ? (
                                            [...Array(3)].map((_, i) => (
                                                <tr key={i} className="animate-pulse">
                                                    <td colSpan="5" className="px-6 py-8 bg-white/[0.02]" />
                                                </tr>
                                            ))
                                        ) : transactions.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-20 text-center text-gray-500">
                                                    No transactions found.
                                                </td>
                                            </tr>
                                        ) : (
                                            transactions.map((tx) => (
                                                <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                                                    <td className="px-6 py-5">
                                                        <div className="font-mono text-[10px] text-indigo-400 mb-1">{tx.orderId}</div>
                                                        <div className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="font-bold text-sm capitalize">{tx.planId}</div>
                                                        <div className="text-[10px] text-gray-500">+{tx.credits} Credits</div>
                                                    </td>
                                                    <td className="px-6 py-5 font-bold">₹{tx.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                    <td className="px-6 py-5">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusStyle(tx.status)}`}>
                                                            {getStatusIcon(tx.status)}
                                                            {tx.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        {tx.status === 'success' && (
                                                            <button
                                                                onClick={() => handleDownloadReceipt(tx.id, tx.orderId)}
                                                                disabled={downloadingId === tx.id}
                                                                className="p-2 bg-white/5 rounded-xl text-gray-400 hover:bg-white/10 hover:text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                {downloadingId === tx.id ? (
                                                                    <Loader2 size={16} className="animate-spin" />
                                                                ) : (
                                                                    <Download size={16} />
                                                                )}
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Billing;
