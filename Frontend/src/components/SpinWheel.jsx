import { useState, useEffect, useRef } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { toast } from 'react-hot-toast';
import { Loader2, Trophy, Clock, Sparkles, X, Copy } from 'lucide-react';
import api from '../configs/axios';

const PRIZES = [
    { id: 'nothing', label: 'Better Luck', sublabel: 'Next Time', color: '#1a1a2e', textColor: '#6b7280' },
    { id: 'credits_2', label: '2', sublabel: 'Credits', color: '#0e4c5e', textColor: '#67e8f9' },
    { id: 'credits_5', label: '5', sublabel: 'Credits', color: '#0891b2', textColor: '#ffffff' },
    { id: 'credits_10', label: '10', sublabel: 'Credits', color: '#06b6d4', textColor: '#ffffff' },
    { id: 'coupon_10', label: '10%', sublabel: 'Off', color: '#6366f1', textColor: '#ffffff' },
    { id: 'credits_20', label: '20', sublabel: 'Credits', color: '#4f46e5', textColor: '#ffffff' },
    { id: 'coupon_50', label: '50%', sublabel: 'Off', color: '#9333ea', textColor: '#ffffff' },
    { id: 'brandhub_80', label: '80%', sublabel: 'Brand Hub', color: '#f59e0b', textColor: '#000000' },
];

const SEGMENT_ANGLE = 360 / PRIZES.length;

function drawWheel(canvas) {
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const center = size / 2;
    const radius = center - 4;
    ctx.clearRect(0, 0, size, size);

    PRIZES.forEach((prize, i) => {
        const startAngle = (i * SEGMENT_ANGLE - 90) * (Math.PI / 180);
        const endAngle = ((i + 1) * SEGMENT_ANGLE - 90) * (Math.PI / 180);

        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.arc(center, center, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = prize.color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.save();
        ctx.translate(center, center);
        const midAngle = ((i + 0.5) * SEGMENT_ANGLE - 90) * (Math.PI / 180);
        ctx.rotate(midAngle);
        ctx.textAlign = 'right';
        ctx.fillStyle = prize.textColor;
        ctx.font = `bold ${size * 0.055}px Inter, sans-serif`;
        ctx.fillText(prize.label, radius * 0.88, -size * 0.022);
        ctx.font = `${size * 0.038}px Inter, sans-serif`;
        ctx.globalAlpha = 0.8;
        ctx.fillText(prize.sublabel, radius * 0.88, size * 0.025);
        ctx.globalAlpha = 1;
        ctx.restore();
    });

    // Center dot
    const g = ctx.createRadialGradient(center, center, 0, center, center, radius * 0.13);
    g.addColorStop(0, '#1a1a2e');
    g.addColorStop(1, '#0a0a0f');
    ctx.beginPath();
    ctx.arc(center, center, radius * 0.13, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(6,182,212,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Outer glow ring
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(6,182,212,0.3)';
    ctx.lineWidth = 3;
    ctx.stroke();
}

// ─── Modal Component ──────────────────────────────────────────────────────────
export function SpinWheelModal({ isOpen, onClose }) {
    const { user } = useUser();
    const { getToken } = useAuth();
    const canvasRef = useRef(null);

    const [spinning, setSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [canSpin, setCanSpin] = useState(false);
    const [nextSpinAt, setNextSpinAt] = useState(null);
    const [countdown, setCountdown] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && canvasRef.current) drawWheel(canvasRef.current);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && user) fetchStatus();
    }, [isOpen, user]);

    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            setResult(null);
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    useEffect(() => {
        if (!nextSpinAt) return;
        const interval = setInterval(() => {
            const diff = new Date(nextSpinAt) - Date.now();
            if (diff <= 0) { setCanSpin(true); setNextSpinAt(null); setCountdown(''); clearInterval(interval); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setCountdown(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
        }, 1000);
        return () => clearInterval(interval);
    }, [nextSpinAt]);

    const fetchStatus = async () => {
        try {
            const token = await getToken();
            const { data } = await api.get('/api/user/spin', { headers: { Authorization: `Bearer ${token}` } });
            setCanSpin(data.canSpin);
            setNextSpinAt(data.nextSpinAt);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSpin = async () => {
        if (!canSpin || spinning) return;
        setSpinning(true);
        setResult(null);
        try {
            const token = await getToken();
            const { data } = await api.post('/api/user/spin', {}, { headers: { Authorization: `Bearer ${token}` } });

            const prizeIdx = PRIZES.findIndex(p => p.id === data.prize.id);
            const targetSegmentAngle = (prizeIdx + 0.5) * SEGMENT_ANGLE;
            const targetRotation = 5 * 360 + (360 - targetSegmentAngle % 360);
            setRotation(prev => prev + targetRotation);

            setTimeout(() => {
                setSpinning(false);
                setCanSpin(false);
                setNextSpinAt(data.nextSpinAt);
                setResult({ ...data.prize, couponCode: data.couponCode });
                if (data.prize.type === 'NOTHING') toast('Better luck next time! 🎲', { icon: '😅' });
                else if (data.prize.type === 'CREDITS') toast.success(`🎉 You won ${data.prize.value} Credits!`);
                else toast.success(`🎁 You won a ${data.prize.value}% discount!`);
            }, 5500);
        } catch (err) {
            setSpinning(false);
            toast.error(err?.response?.data?.message || 'Spin failed');
            if (err?.response?.data?.nextSpinAt) { setNextSpinAt(err.response.data.nextSpinAt); setCanSpin(false); }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={!spinning ? onClose : undefined}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-md bg-[#080810] border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/80 animate-in fade-in zoom-in-95 duration-300">
                {/* Glow */}
                <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.08),transparent_60%)] pointer-events-none" />

                {/* Close */}
                {!spinning && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
                    >
                        <X size={16} />
                    </button>
                )}

                {/* Header */}
                <div className="text-center mb-5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-3">
                        <Sparkles size={11} className="text-cyan-400" />
                        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Daily Fortune Wheel</span>
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Spin for Rewards</h3>
                    <p className="text-[11px] text-gray-500 mt-1">One free spin every 24 hours</p>
                </div>

                {/* Wheel */}
                <div className="relative flex items-center justify-center mb-5">
                    {/* Pointer */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-0.5 z-10">
                        <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[20px] border-l-transparent border-r-transparent border-t-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,1)]" />
                    </div>
                    <div
                        style={{
                            transition: spinning ? 'transform 5.5s cubic-bezier(0.17, 0.67, 0.12, 1)' : 'none',
                            transform: `rotate(${rotation}deg)`,
                        }}
                    >
                        <canvas
                            ref={canvasRef}
                            width={300}
                            height={300}
                            className="rounded-full drop-shadow-[0_0_40px_rgba(6,182,212,0.25)]"
                        />
                    </div>
                </div>

                {/* Result */}
                {result && (
                    <div className={`mb-4 p-4 rounded-2xl border text-center animate-in fade-in slide-in-from-bottom-2 duration-400 ${result.type === 'NOTHING' ? 'bg-white/5 border-white/10' : 'bg-cyan-500/10 border-cyan-500/30'
                        }`}>
                        {result.type === 'NOTHING' ? (
                            <p className="text-sm font-bold text-gray-400">Better luck next time! Come back tomorrow.</p>
                        ) : (
                            <div>
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <Trophy size={16} className="text-yellow-400" />
                                    <p className="text-sm font-black text-white">You won!</p>
                                </div>
                                {result.type === 'CREDITS' && (
                                    <p className="text-3xl font-black text-cyan-400">{result.value} <span className="text-lg">Credits</span></p>
                                )}
                                {(result.type === 'COUPON' || result.type === 'BRANDHUB') && result.couponCode && (
                                    <div>
                                        <p className="text-2xl font-black text-cyan-400">{result.value}% <span className="text-base">Discount</span></p>
                                        <div className="mt-2 flex items-center justify-center gap-2">
                                            <code className="px-3 py-1.5 bg-black/50 border border-cyan-500/30 rounded-lg text-xs font-black text-cyan-300 tracking-widest">
                                                {result.couponCode}
                                            </code>
                                            <button
                                                onClick={() => { navigator.clipboard.writeText(result.couponCode); toast.success('Copied!'); }}
                                                className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition"
                                            >
                                                <Copy size={12} />
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-1">Valid at checkout · Expires in 7 days</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Button / Countdown */}
                {loading ? (
                    <div className="flex justify-center py-4"><Loader2 size={24} className="animate-spin text-gray-500" /></div>
                ) : canSpin ? (
                    <button
                        onClick={handleSpin}
                        disabled={spinning}
                        className="w-full py-4 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-60 rounded-2xl font-black text-sm uppercase tracking-widest text-white transition-all active:scale-95 shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                    >
                        {spinning ? <><Loader2 size={16} className="animate-spin" /> Spinning...</> : <><Sparkles size={16} /> Spin the Wheel!</>}
                    </button>
                ) : (
                    <div className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center gap-1">
                        <div className="flex items-center gap-2 text-gray-500">
                            <Clock size={13} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Next Spin In</span>
                        </div>
                        <span className="text-2xl font-black text-white tabular-nums tracking-widest">{countdown || '--:--:--'}</span>
                    </div>
                )}

                <p className="text-center text-[9px] text-gray-700 mt-3 uppercase tracking-widest">
                    House edge applies · Play responsibly
                </p>
            </div>
        </div>
    );
}

// ─── Navbar Countdown Badge (mini) ───────────────────────────────────────────
export function SpinCountdownBadge({ onOpenWheel }) {
    const { user } = useUser();
    const { getToken } = useAuth();
    const [canSpin, setCanSpin] = useState(false);
    const [countdown, setCountdown] = useState('');
    const [nextSpinAt, setNextSpinAt] = useState(null);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        if (user) fetchStatus();
    }, [user]);

    useEffect(() => {
        if (!nextSpinAt) return;
        const interval = setInterval(() => {
            const diff = new Date(nextSpinAt) - Date.now();
            if (diff <= 0) { setCanSpin(true); setNextSpinAt(null); setCountdown(''); clearInterval(interval); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setCountdown(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
        }, 1000);
        return () => clearInterval(interval);
    }, [nextSpinAt]);

    const fetchStatus = async () => {
        try {
            const token = await getToken();
            const { data } = await api.get('/api/user/spin', { headers: { Authorization: `Bearer ${token}` } });
            setCanSpin(data.canSpin);
            setNextSpinAt(data.nextSpinAt);
        } catch (e) { console.error(e); }
        finally { setChecked(true); }
    };

    if (!user || !checked) return null;

    return (
        <button
            onClick={onOpenWheel}
            className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 ${canSpin
                    ? 'bg-gradient-to-r from-cyan-600/20 to-indigo-600/20 border-cyan-500/40 text-cyan-400 hover:border-cyan-400/60 animate-pulse'
                    : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10 hover:text-gray-300'
                }`}
            title={canSpin ? 'Spin the wheel!' : `Next spin: ${countdown}`}
        >
            <Sparkles size={11} className={canSpin ? 'text-cyan-400' : 'text-gray-500'} />
            <span className="hidden sm:block">{canSpin ? 'Spin!' : countdown || '--:--:--'}</span>
        </button>
    );
}
