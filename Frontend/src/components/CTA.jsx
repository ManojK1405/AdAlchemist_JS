import { Users, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function CTA() {
    const navigate = useNavigate();
    return (
        <section className="py-24 px-4 relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-cyan-600/20 blur-[120px] rounded-full pointer-events-none" />

            <div className="container mx-auto max-w-4xl relative z-10">
                <div className="rounded-[2.5rem] bg-linear-to-b from-cyan-900/40 to-slate-900/80 border border-cyan-500/30 p-10 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-cyan-900/20 backdrop-blur-xl group">
                    <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-30 mix-blend-overlay" />

                    {/* Animated grid background */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_10%,transparent_80%)] opacity-30 pointer-events-none transition-opacity duration-700 group-hover:opacity-50" />

                    <div className="relative z-10">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            className="w-16 h-16 mx-auto mb-8 rounded-2xl bg-linear-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 relative"
                        >
                            <div className="absolute inset-0 bg-cyan-400 rounded-2xl blur-lg opacity-40 animate-pulse" />
                            <Users className="text-white w-8 h-8 relative z-10" />
                        </motion.div>

                        <motion.h2 className="text-3xl md:text-5xl font-bold mb-6 text-white tracking-tight"
                            initial={{ y: 30, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
                        >
                            Elevate Your Creations <br /> <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-blue-400">Join the Alchemist Guild</span>
                        </motion.h2>

                        <motion.p className="text-base md:text-lg text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed"
                            initial={{ y: 30, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
                        >
                            Don't iterate in isolation. Connect with visionary creators, discover groundbreaking prompts, and master the alchemy of high-converting AI advertisements.
                        </motion.p>

                        <motion.div
                            initial={{ y: 30, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.3 }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-4"
                        >
                            <button
                                onClick={() => navigate('/community')}
                                className="group/btn relative inline-flex items-center justify-center gap-3 rounded-full px-8 py-4 text-base font-bold text-white bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 overflow-hidden transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(6,182,212,0.4)]"
                            >
                                <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-linear-to-b from-transparent via-transparent to-black pointer-events-none"></span>
                                <span className="relative flex items-center gap-2">
                                    Explore the Community <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1.5 transition-transform duration-300" />
                                </span>
                            </button>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
};
