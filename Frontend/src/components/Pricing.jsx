import { useState } from 'react';
import Title from './Title';
import api from '../configs/axios';
import { useAuth, useUser } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import { Check, Zap, Shield, Crown } from 'lucide-react';

const PLANS = [
    {
        id: 'starter',
        name: 'Starter',
        price: '49.9',
        credits: '100',
        icon: <Zap className="text-blue-400" />,
        features: ['100 Generation Credits', 'Standard Processing', 'Basic Support', 'Email Updates'],
        color: 'from-blue-600/20 to-indigo-600/20'
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '199.9',
        credits: '500',
        icon: <Shield className="text-indigo-400" />,
        features: ['500 Generation Credits', 'Priority Processing', 'Professional Templates', 'Priority Support'],
        popular: true,
        color: 'from-indigo-600/30 to-violet-600/30'
    },
    {
        id: 'agency',
        name: 'Agency',
        price: '499.9',
        credits: '2,000',
        icon: <Crown className="text-yellow-400" />,
        features: ['2,000 Generation Credits', 'Ultra-Fast Processing', 'Custom Brand Kits', '24/7 Dedicated Support'],
        color: 'from-violet-600/20 to-purple-600/20'
    }
];

export default function Pricing() {
    const { getToken } = useAuth();
    const { user } = useUser();
    const [loading, setLoading] = useState(null);

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
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
            const { data: orderData } = await api.post('/api/payment/create-order', { planId }, {
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
                        // Refresh credits display if needed, or redirect
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
                    color: "#6366f1",
                },
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();

        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to initiate payment');
        } finally {
            setLoading(null);
        }
    };

    return (
        <section id="pricing" className="py-20">
            <div className="max-w-6xl mx-auto px-4">
                <Title
                    title="Pricing"
                    heading="Fuel Your Creativity"
                    description="Choose a plan that fits your production needs. All plans include full commercial rights."
                />

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-12">
                    {PLANS.map((plan) => (
                        <div
                            key={plan.id}
                            className={`relative flex flex-col p-8 rounded-3xl border border-white/10 bg-gradient-to-br ${plan.color} backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] hover:border-white/20 ${plan.popular ? 'ring-2 ring-indigo-500' : ''}`}
                        >
                            {plan.popular && (
                                <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg">
                                    Most Popular
                                </span>
                            )}

                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-white/5 rounded-2xl">
                                    {plan.icon}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">{plan.name}</h3>
                                    <p className="text-xs text-indigo-400 font-bold uppercase tracking-tighter">{plan.credits} Credits</p>
                                </div>
                            </div>

                            <div className="mb-8">
                                <span className="text-4xl font-bold">₹{plan.price}</span>
                                <span className="text-gray-400 text-sm ml-2">/ one-time</span>
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
                                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-500/20'
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
                    ))}
                </div>
            </div>
        </section>
    );
}
