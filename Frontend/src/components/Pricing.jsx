import { useState, useEffect } from 'react';
import Title from './Title';
import api from '../configs/axios';
import { useAuth, useUser } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import { Check, Zap, Shield, Crown, Clock, Ticket, Sparkles, Loader2, Coins, TrendingUp, ShieldCheck } from 'lucide-react';
import Modal from './Modal';

const PLANS = [
    {
        id: 'starter',
        name: 'Starter',
        price: '99',
        credits: '100',
        icon: <Zap className="text-blue-400" />,
        features: ['100 Generation Credits', 'Standard Processing', 'Basic Support', 'Email Updates'],
        color: 'from-blue-600/20 to-cyan-600/20'
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '499',
        credits: '600',
        icon: <Shield className="text-cyan-400" />,
        features: [
            '600 Generation Credits',
            'Priority Processing',
            'FULL Brand Hub Access',
            'Advanced Style Protocols',
            'Pro Templates & Aesthetics',
            'Priority Support'
        ],
        popular: true,
        color: 'from-cyan-600/30 to-cyan-600/30'
    },
    {
        id: 'agency',
        name: 'Agency',
        price: '1499',
        credits: '2,500',
        icon: <Crown className="text-yellow-400" />,
        features: [
            '2,500 Generation Credits',
            'Ultra-Fast Processing',
            'Multi-Client Identity Hub',
            'Lifetime Pipeline Access',
            'Agency Whitespace Tools'
        ],
        color: 'from-cyan-600/20 to-indigo-600/20'
    }
];

export default function Pricing() {
    const { getToken } = useAuth();
    const { user } = useUser();
    const [loading, setLoading] = useState(null);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [isApplying, setIsApplying] = useState(false);
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [config, setConfig] = useState({
        enableSocialProof: true,
        enableScarcity: true,
        enableUrgency: true,
        enableAnchoring: true,
        enableShaming: true
    });

    const [userStatus, setUserStatus] = useState({
        credits: 0,
        hasProAccess: false,
        hasBrandHubAccess: false,
        hasPipelineAccess: false
    });

    useEffect(() => {
        const fetchStatus = async () => {
            if (!user) return;
            try {
                const token = await getToken();
                const { data } = await api.get('/api/user/credits', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUserStatus(data);
            } catch (err) {
                console.error("Failed to fetch user status", err);
            }
        };

        const fetchConfig = async () => {
            try {
                const { data } = await api.get('/api/user/config');
                setConfig(data);
            } catch (err) {
                console.error("Failed to fetch config", err);
            }
        };

        fetchStatus();
        fetchConfig();
    }, [user, getToken]);

    // Modal State
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { },
        type: "info"
    });

    const openConfirm = (config) => setModalConfig({ ...config, isOpen: true });
    const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleApplyCoupon = async () => {
        if (!user) return toast.error("Please login to apply coupons");
        if (!couponCode) return toast.error("Enter a code");

        setIsApplying(true);
        try {
            const token = await getToken();
            const { data } = await api.post('/api/coupon/validate', { code: couponCode }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.type === 'FREE_CREDITS') {
                // Instantly redeem
                const { data: redeemData } = await api.post('/api/coupon/redeem', { code: couponCode }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success(redeemData.message);
                setCouponCode('');
                // Optionally refresh credits display globally if possible, or reload
                setTimeout(() => window.location.reload(), 1500);
            } else {
                setAppliedCoupon(data);
                toast.success(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Invalid coupon code");
            setAppliedCoupon(null);
        } finally {
            setIsApplying(false);
        }
    };

    const handleSubscription = async (planId) => {
        if (!user) {
            toast.error('Please login to purchase credits');
            return;
        }

        setLoading(planId);
        try {
            const res = await loadRazorpay();
            if (!res) {
                toast.error('Razorpay SDK failed to load. Check your connection.');
                return;
            }

            const token = await getToken();
            const { data: orderData } = await api.post('/api/payment/create-order', {
                planId,
                couponCode: appliedCoupon?.type === 'DISCOUNT' ? couponCode : null
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "AdAlchemist",
                description: `Purchase ${planId} plan`,
                order_id: orderData.orderId,
                handler: async (response) => {
                    try {
                        const freshToken = await getToken();
                        const { data: verifyData } = await api.post('/api/payment/verify-payment', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        }, {
                            headers: { Authorization: `Bearer ${freshToken}` }
                        });
                        toast.success(verifyData.message);
                        window.location.reload();
                    } catch (error) {
                        toast.error(error.response?.data?.message || 'Verification failed');
                    }
                },
                prefill: {
                    name: user.fullName,
                    email: user.primaryEmailAddress.emailAddress,
                },
                theme: {
                    color: "#06b6d4",
                },
                modal: {
                    ondismiss: async () => {
                        try {
                            const freshToken = await getToken();
                            await api.post('/api/payment/cancel-payment', {
                                orderId: orderData.orderId
                            }, {
                                headers: { Authorization: `Bearer ${freshToken}` }
                            });
                        } catch (e) {
                            console.error("Error cancelling payment tracking", e);
                        }
                    }
                }
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.on('payment.failed', async (response) => {
                try {
                    const freshToken = await getToken();
                    await api.post('/api/payment/cancel-payment', {
                        orderId: orderData.orderId
                    }, {
                        headers: { Authorization: `Bearer ${freshToken}` }
                    });
                    toast.error(response.error.description || 'Payment failed');
                } catch (e) {
                    console.error("Error updating failed payment status", e);
                }
            });
            paymentObject.open();

        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to initiate payment');
        } finally {
            setLoading(null);
        }
    };

    const handleUnlockWithCredits = async () => {
        if (!user) return toast.error("Please login to unlock features");

        openConfirm({
            title: "Premium Unlock",
            message: config.enableScarcity
                ? "Swap 1,000 Credits for Lifetime Pipeline Access? Heads up: Only 4 slots remaining for the 'Legacy Tier' unlock today."
                : "Unlock Lifetime Pipeline Access for 1,000 Credits? This will enable background queueing for your account.",
            confirmText: "Unlock Now",
            cancelText: config.enableShaming ? "No, I'll wait manually" : "Dismiss",
            type: "info",
            onConfirm: async () => {
                closeModal();
                setIsUnlocking(true);
                try {
                    const token = await getToken();
                    const { data } = await api.post('/api/user/unlock-pipeline', {}, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    toast.success(data.message);
                    window.location.reload();
                } catch (error) {
                    toast.error(error.response?.data?.message || "Unlock failed");
                } finally {
                    setIsUnlocking(false);
                }
            }
        });
    };

    const handleUnlockBrandHubWithCredits = async () => {
        if (!user) return toast.error("Please login to unlock features");

        const UNLOCK_COST = userStatus.hasProAccess ? 500 : 750;

        openConfirm({
            title: "Unlock Creative DNA Hub",
            message: config.enableScarcity
                ? `Swap ${UNLOCK_COST} Credits for Full Brand Hub Access? (Pro users save 33%). Current capacity is limited to 15 slots this week.`
                : `Unlock Unlimited Brand Identities and Visual DNA for ${UNLOCK_COST} Credits?`,
            confirmText: "Evolve Identity",
            cancelText: "Keep Single Identity",
            type: "info",
            onConfirm: async () => {
                closeModal();
                setIsUnlocking(true);
                try {
                    const token = await getToken();
                    const { data } = await api.post('/api/user/unlock-brand-hub', {}, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    toast.success(data.message);
                    window.location.reload();
                } catch (error) {
                    toast.error(error.response?.data?.message || "Unlock failed");
                } finally {
                    setIsUnlocking(false);
                }
            }
        });
    };

    return (
        <section id="pricing" className="py-20">
            <div className="max-w-6xl mx-auto px-4">
                <Title
                    title="Pricing"
                    heading="Fuel Your Productivity"
                    description="Choose a plan that fits your production needs. All plans include full commercial rights."
                />

                {/* Scarcity/Urgency Bar */}
                {config.enableUrgency && (
                    <div className="max-w-4xl mx-auto -mt-6 mb-12 flex flex-wrap items-center justify-center gap-4 md:gap-6 px-6 py-3 bg-cyan-600/5 border border-cyan-500/10 rounded-full backdrop-blur-md">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-cyan-400">
                            <TrendingUp size={14} /> 124 Creators joined today
                        </div>
                        <div className="hidden md:block h-4 w-px bg-white/10" />
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-yellow-500">
                            Limited: ₹499 Lifetime Access (Pricing increasing soon)
                        </div>
                    </div>
                )}

                {/* Coupon Code Section */}
                <div className="max-w-xl mx-auto mb-16 mt-8">
                    <div className="bg-white/5 border border-white/10 p-2 rounded-2xl flex gap-2 backdrop-blur-md shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        <div className="flex-1 relative flex items-center pl-4">
                            <Ticket size={18} className="text-cyan-500 mr-3" />
                            <input
                                type="text"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                placeholder="ENTER COUPON CODE..."
                                className="w-full bg-transparent border-none outline-none font-bold text-xs tracking-widest placeholder:text-gray-600 text-white"
                            />
                        </div>
                        <button
                            onClick={handleApplyCoupon}
                            disabled={isApplying || !couponCode}
                            className="bg-white text-black px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-cyan-400 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isApplying ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                            {appliedCoupon ? 'Apply Another' : 'Redeem / Apply'}
                        </button>
                    </div>
                    {appliedCoupon && (
                        <p className="text-center mt-3 text-[10px] font-bold text-cyan-400 uppercase tracking-[0.2em] animate-pulse">
                            🎉 {appliedCoupon.message}
                        </p>
                    )}
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {PLANS.map((plan) => {
                        const originalPrice = parseInt(plan.price);
                        const discount = appliedCoupon?.type === 'DISCOUNT' ? parseFloat(((originalPrice * appliedCoupon.value) / 100).toFixed(2)) : 0;
                        const finalPrice = parseFloat((originalPrice - discount).toFixed(2));

                        return (
                            <div
                                key={plan.id}
                                className={`relative flex flex-col p-8 rounded-3xl border border-white/10 bg-gradient-to-br ${plan.color} backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] hover:border-white/20 ${plan.popular ? 'ring-2 ring-cyan-500' : ''}`}
                            >
                                {plan.popular && (
                                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-cyan-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg">
                                        Most Popular
                                    </span>
                                )}

                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-white/5 rounded-2xl">
                                        {plan.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">{plan.name}</h3>
                                        <p className="text-xs text-cyan-400 font-bold uppercase tracking-tighter">{plan.credits} Credits</p>
                                    </div>
                                </div>

                                <div className="mb-8">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-black">₹{finalPrice.toFixed(2)}</span>
                                        {(discount > 0 || config.enableAnchoring) && (
                                            <span className="text-lg text-gray-500 line-through font-bold">
                                                ₹{discount > 0 ? originalPrice : Math.round(originalPrice * 1.5)}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest block mt-1">/ one-time purchase</span>
                                </div>

                                <ul className="space-y-4 mb-10 flex-1">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                                            <div className="p-1 bg-green-500/10 rounded-full">
                                                <Check size={12} className="text-green-500" />
                                            </div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => handleSubscription(plan.id)}
                                    disabled={loading === plan.id}
                                    className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${plan.popular
                                        ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-xl shadow-cyan-500/20'
                                        : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                                        }`}
                                >
                                    {loading === plan.id ? (
                                        <span className="animate-spin border-2 border-white/30 border-t-white rounded-full w-5 h-5" />
                                    ) : (
                                        `Get ${plan.name}`
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Standalone Pipeline Unlock */}
                {!userStatus.hasPipelineAccess && <div className="mt-20 max-w-4xl mx-auto p-8 rounded-3xl border border-cyan-500/20 bg-cyan-500/5 backdrop-blur-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Clock size={160} />
                    </div>

                    <div className="relative flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                        <div className="flex-1 space-y-4">
                            <div className="flex items-center justify-center md:justify-start gap-2 text-cyan-400 font-black uppercase tracking-[0.2em] text-[10px]">
                                <Zap size={14} /> Power User Add-on
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-widest text-white">Unlock Generation Pipeline</h3>
                            <p className="text-gray-400 text-sm leading-relaxed max-w-xl">
                                Schedule multiple generations and get notified when they're ready. Perfect for power users and agencies bulk-producing content.
                                <span className="text-cyan-400 font-bold ml-1">Included for FREE in Agency plan.</span>
                            </p>
                        </div>

                        <div className="w-full md:w-auto text-center space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10">
                            <div className="space-y-1">
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-3xl font-black text-white">₹499</span>
                                    {config.enableAnchoring && (
                                        <span className="text-sm text-gray-500 line-through font-bold">₹1,499</span>
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">One-Time Unlock</p>
                            </div>
                            <button
                                onClick={() => handleSubscription('pipeline_unlock')}
                                disabled={loading === 'pipeline_unlock' || isUnlocking}
                                className="w-full md:w-48 py-4 bg-white text-black rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-cyan-400 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {loading === 'pipeline_unlock' ? (
                                    <span className="animate-spin border-2 border-black/30 border-t-black rounded-full w-4 h-4 inline-block" />
                                ) : "Unlock Now (Cash)"}
                            </button>
                            <button
                                onClick={handleUnlockWithCredits}
                                disabled={loading || isUnlocking}
                                className="w-full md:w-48 py-4 bg-cyan-600/10 border border-cyan-500/30 text-cyan-400 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-cyan-600/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isUnlocking ? (
                                    <span className="animate-spin border-2 border-cyan-400/30 border-t-cyan-400 rounded-full w-4 h-4" />
                                ) : (
                                    <>
                                        <Coins size={14} /> 1,000 Credits
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>}

                {/* Standalone Brand Hub Unlock */}
                {!userStatus.hasBrandHubAccess && (
                    <div className="mt-12 max-w-4xl mx-auto p-8 rounded-3xl border border-purple-500/20 bg-purple-500/5 backdrop-blur-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <ShieldCheck size={160} />
                        </div>

                        <div className="relative flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                            <div className="flex-1 space-y-4">
                                <div className="flex items-center justify-center md:justify-start gap-2 text-purple-400 font-black uppercase tracking-[0.2em] text-[10px]">
                                    <Sparkles size={14} /> Brand Identity Protocol
                                </div>
                                <h3 className="text-2xl font-black uppercase tracking-widest text-white">Unlock Brand Intelligence Hub</h3>
                                <p className="text-gray-400 text-sm leading-relaxed max-w-xl">
                                    Manage unlimited brand identities, store signatures, colors, and voices for different clients.
                                    <span className="text-purple-400 font-bold ml-1">Included for FREE in Pro and Agency plans.</span>
                                </p>
                            </div>

                            <div className="w-full md:w-auto text-center space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10">
                                <div className="space-y-1">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-3xl font-black text-white">₹{userStatus.hasProAccess ? '199' : '299'}</span>
                                        {config.enableAnchoring && (
                                            <span className="text-sm text-gray-500 line-through font-bold">₹{userStatus.hasProAccess ? '299' : '899'}</span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                        {userStatus.hasProAccess ? '33% Pro Discount' : 'One-Time Unlock'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleSubscription(userStatus.hasProAccess ? 'brand_hub_unlock_pro' : 'brand_hub_unlock')}
                                    disabled={loading === 'brand_hub_unlock' || loading === 'brand_hub_unlock_pro' || isUnlocking}
                                    className="w-full md:w-48 py-4 bg-white text-black rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-purple-400 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {(loading === 'brand_hub_unlock' || loading === 'brand_hub_unlock_pro') ? (
                                        <span className="animate-spin border-2 border-black/30 border-t-black rounded-full w-4 h-4 inline-block" />
                                    ) : "Unlock Now (Cash)"}
                                </button>
                                <button
                                    onClick={handleUnlockBrandHubWithCredits}
                                    disabled={loading || isUnlocking}
                                    className="w-full md:w-48 py-4 bg-purple-600/10 border border-purple-500/30 text-purple-400 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-purple-600/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isUnlocking ? (
                                        <span className="animate-spin border-2 border-purple-400/30 border-t-purple-400 rounded-full w-4 h-4" />
                                    ) : (
                                        <>
                                            <Coins size={14} /> {userStatus.hasProAccess ? '500' : '750'} Credits
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Modal
                {...modalConfig}
                onClose={closeModal}
                loading={isUnlocking}
            />
        </section>
    );
}
