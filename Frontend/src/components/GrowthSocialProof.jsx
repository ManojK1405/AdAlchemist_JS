import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ShoppingCart, Zap, Users, X } from 'lucide-react';
import api from '../configs/axios';
import { useUser } from '@clerk/clerk-react';

const NOTIFICATIONS = [
    { id: 1, text: "Someone from London just unlocked Pipeline Access", icon: <Zap size={14} className="text-cyan-400" /> },
    { id: 2, text: "Pro Plan purchased by a Creator in New York", icon: <ShoppingCart size={14} className="text-purple-400" /> },
    { id: 3, text: "1,200 Credits redeemed via coupon by User#482", icon: <Sparkles size={14} className="text-yellow-400" /> },
    { id: 4, text: "New Agency joined the Alchemist Community", icon: <Users size={14} className="text-blue-400" /> },
    { id: 5, text: "Pipeline Queue cleared for 12 pending tasks", icon: <Zap size={14} className="text-cyan-400" /> },
];

const GrowthSocialProof = () => {
    const [current, setCurrent] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [isEnabled, setIsEnabled] = useState(false);
    const { user, isLoaded } = useUser();

    useEffect(() => {
        if (!isLoaded || !user) {
            setIsEnabled(false);
            return;
        }
        const checkConfig = async () => {
            try {
                const { data } = await api.get('/api/user/config');
                setIsEnabled(data.enableSocialProof);
            } catch (err) {
                setIsEnabled(false);
            }
        };
        checkConfig();
    }, [user]);

    useEffect(() => {
        if (!isEnabled) return;

        const showTimeout = setTimeout(() => setIsVisible(true), 5000); // Show after 5s

        const interval = setInterval(() => {
            setIsVisible(false);
            setTimeout(() => {
                setCurrent(prev => (prev + 1) % NOTIFICATIONS.length);
                setIsVisible(true);
            }, 1000);
        }, 15000); // Every 15s

        return () => {
            clearTimeout(showTimeout);
            clearInterval(interval);
        };
    }, [isEnabled]);

    if (!isEnabled) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, x: -50, y: 50 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    exit={{ opacity: 0, x: -50, scale: 0.9 }}
                    className="fixed bottom-6 left-6 z-[999] max-w-[280px]"
                >
                    <div className="bg-[#111]/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10 group-hover:scale-110 transition-transform">
                            {NOTIFICATIONS[current].icon}
                        </div>

                        <div className="flex-1">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-tight">
                                {NOTIFICATIONS[current].text}
                            </p>
                            <span className="text-[8px] text-cyan-500/60 font-black uppercase mt-1 block">Just Now</span>
                        </div>

                        <button
                            onClick={() => setIsVisible(false)}
                            className="absolute top-2 right-2 text-gray-700 hover:text-white transition-colors"
                        >
                            <X size={10} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default GrowthSocialProof;
