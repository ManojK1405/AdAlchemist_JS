import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, HelpCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

const icons = {
    warning: <AlertTriangle className="text-yellow-500" size={32} />,
    info: <HelpCircle className="text-cyan-500" size={32} />,
    danger: <AlertCircle className="text-red-500" size={32} />,
    success: <ShieldCheck className="text-green-500" size={32} />,
};

const Modal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Dismiss",
    type = "info",
    loading = false
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
                    >
                        {/* Glow Effect */}
                        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-600/20 blur-[80px] pointer-events-none" />
                        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-600/20 blur-[80px] pointer-events-none" />

                        <div className="p-8 pb-4 flex flex-col items-center text-center">
                            <div className="mb-6 p-4 bg-white/5 rounded-3xl border border-white/10">
                                {icons[type]}
                            </div>

                            <h3 className="text-2xl font-black uppercase tracking-wider mb-3 text-white">
                                {title}
                            </h3>

                            <p className="text-gray-400 text-sm leading-relaxed mb-8 px-4 font-medium">
                                {message}
                            </p>
                        </div>

                        <div className="p-6 bg-white/[0.02] border-t border-white/5 flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 py-4 bg-white/5 text-gray-400 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={loading}
                                className={`flex-1 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 ${type === 'danger'
                                        ? 'bg-red-600 hover:bg-red-500 shadow-red-600/20'
                                        : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/20'
                                    } text-white`}
                            >
                                {loading && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />}
                                {confirmText}
                            </button>
                        </div>

                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default Modal;
