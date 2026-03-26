import { ArrowRightIcon, PlayIcon, ZapIcon, CheckIcon, X } from 'lucide-react';
import { PrimaryButton, GhostButton } from './Buttons';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Hero() {
    const { user } = useUser();
    const { openSignUp } = useClerk();
    const navigate = useNavigate();
    const [showDemo, setShowDemo] = useState(false);

    const galleryStripImages = [
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000', // Red shoes
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000', // Headphones
        '/blue-car.png', // Vibrant Blue Car
        'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=1600'  // Flask
    ];

    const [currentImage, setCurrentImage] = useState(() =>
        galleryStripImages[Math.floor(Math.random() * galleryStripImages.length)]
    );

    const handleStartGenerating = () => {
        if (!user) {
            toast.error("Please Login in to Generate");
            openSignUp();
        } else {
            navigate('/generate');
        }
    };

    const trustedUserImages = [
        'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=50',
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop'
    ];

    const trustedLogosText = [
        'Adobe',
        'Figma',
        'Canva',
        'Meta',
        'Spotify'
    ];

    return (
        <>
            <section id="home" className="relative z-10">
                <div className="max-w-6xl mx-auto px-4 min-h-screen max-md:w-screen max-md:overflow-hidden pt-32 md:pt-26 flex items-center justify-center">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                        <div className="text-left">
                            <motion.a className="inline-flex items-center gap-3 pl-3 pr-4 py-1.5 rounded-full bg-white/10 mb-6 justify-start"
                                initial={{ y: 60, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1 }}
                            >
                                <div className="flex -space-x-2">
                                    {trustedUserImages.map((src, i) => (
                                        <img
                                            key={i}
                                            src={src}
                                            alt={`Client ${i + 1}`}
                                            className="size-6 rounded-full border border-black/50"
                                            width={40}
                                            height={40}
                                        />
                                    ))}
                                </div>
                                <span className="text-xs text-gray-200/90">
                                    Trusted by 10,000+ Creators Worldwide
                                </span>
                            </motion.a>

                            <motion.h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6 max-w-xl"
                                initial={{ y: 60, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1, delay: 0.1 }}
                            >
                                Create Viral Ads <br />
                                <span className="bg-clip-text text-transparent bg-linear-to-r from-cyan-300 to-cyan-400">
                                    In Seconds
                                </span>
                            </motion.h1>

                            <motion.p className="text-gray-300 max-w-lg mb-8"
                                initial={{ y: 60, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1, delay: 0.2 }}
                            >
                                Uses computer vision and generative AI to create realistic, brand-consistent creatives automatically.
                                Helps businesses produce platform-ready ads faster, cheaper, and at scale.
                            </motion.p>

                            <motion.div className="flex flex-col sm:flex-row items-center gap-4 mb-8"
                                initial={{ y: 60, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1, delay: 0.3 }}
                            >
                                <div className="w-full sm:w-auto relative group">
                                    {/* Animated Aura Background */}
                                    <div className="absolute -inset-1 bg-linear-to-r from-cyan-500 to-blue-600 rounded-full blur-lg opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-pulse" />

                                    <motion.button
                                        onClick={handleStartGenerating}
                                        whileHover={{ scale: 1.05, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        animate={{
                                            y: [0, -4, 0],
                                        }}
                                        transition={{
                                            y: {
                                                duration: 3,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }
                                        }}
                                        className="relative max-sm:w-full flex items-center justify-center gap-2 px-8 py-4 bg-white text-black rounded-full font-black text-sm uppercase tracking-wider shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:shadow-cyan-500/20 list-none transition-all"
                                    >
                                        Start Generating
                                        <div className="flex items-center justify-center bg-black text-white p-1 rounded-full group-hover:translate-x-1 transition-transform">
                                            <ArrowRightIcon className="size-3" strokeWidth={3} />
                                        </div>

                                        {/* Floating Badge */}
                                        <div className="absolute -top-3 -right-2 bg-cyan-500 text-[9px] font-black text-white px-2 py-0.5 rounded-full shadow-lg border border-black/10 animate-bounce">
                                            FREE
                                        </div>
                                    </motion.button>
                                </div>
                                <div className='w-full sm:w-auto'>
                                    <GhostButton
                                        onClick={() => setShowDemo(true)}
                                        className="max-sm:w-full max-sm:justify-center py-3 px-5"
                                    >
                                        <PlayIcon className="size-4" />
                                        Watch Demo
                                    </GhostButton>
                                </div>
                            </motion.div>

                            <motion.div className="flex sm:inline-flex overflow-hidden items-center max-sm:justify-center text-sm text-gray-200 bg-white/10 rounded"
                                initial={{ y: 60, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1, delay: 0.1 }}
                            >
                                <div className="flex items-center gap-2 p-2 px-3 sm:px-6.5 hover:bg-white/3 transition-colors">
                                    <ZapIcon className="size-4 text-sky-500" />
                                    <div>
                                        <div>Seconds To Create</div>
                                        <div className="text-xs text-gray-400">
                                            Optimized Social Formats
                                        </div>
                                    </div>
                                </div>

                                <div className="hidden sm:block h-6 w-px bg-white/6" />

                                <div className="flex items-center gap-2 p-2 px-3 sm:px-6.5 hover:bg-white/3 transition-colors">
                                    <CheckIcon className="size-4 text-cyan-500" />
                                    <div>
                                        <div>Commercial Rights</div>
                                        <div className="text-xs text-gray-400">
                                            Use Creatives Anywhere
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Right: modern mockup card */}
                        <motion.div className="mx-auto w-full max-w-lg"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1, delay: 0.5 }}
                        >
                            <motion.div className="rounded-3xl overflow-hidden border border-white/6 shadow-2xl bg-linear-to-b from-black/50 to-transparent">
                                <div className="relative aspect-16/10 bg-gray-900">
                                    <AnimatePresence mode='wait'>
                                        <motion.img
                                            key={currentImage}
                                            src={currentImage}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            alt="agency-work-preview"
                                            className="w-full h-full object-cover object-center"
                                        />
                                    </AnimatePresence>
                                    <div className="absolute left-4 top-4 px-3 py-1 rounded-full bg-black/15 backdrop-blur-sm text-xs">
                                        Social Ready • 16:9 & 9:16
                                    </div>
                                </div>
                            </motion.div>

                            <div className="mt-4 flex gap-3 items-center justify-start">
                                {galleryStripImages.map((src, i) => (
                                    <motion.div
                                        key={i}
                                        onClick={() => setCurrentImage(src)}
                                        initial={{ y: 20, opacity: 0 }}
                                        whileInView={{ y: 0, opacity: 1 }}
                                        viewport={{ once: true }}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1, delay: 0.1 + i * 0.1 }}
                                        className={`w-14 h-10 rounded-lg overflow-hidden border cursor-pointer transition-colors ${currentImage === src ? 'border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'border-white/6 hover:border-white/20'}`}
                                    >
                                        <img
                                            src={src}
                                            alt="project-thumbnail"
                                            className="w-full h-full object-cover"
                                        />
                                    </motion.div>
                                ))}

                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* LOGO MARQUEE */}
            <motion.section className="border-y border-white/6 bg-white/1 max-md:mt-10"
                initial={{ y: 60, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1 }}
            >
                <div className="max-w-6xl mx-auto px-6">
                    <div className="w-full overflow-hidden py-6">
                        <div className="flex gap-14 items-center justify-center animate-marquee whitespace-nowrap">
                            {trustedLogosText.concat(trustedLogosText).map((logo, i) => (
                                <span
                                    key={i}
                                    className="mx-6 text-sm md:text-base font-semibold text-gray-400 hover:text-gray-300 tracking-wide transition-colors"
                                >
                                    {logo}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.section >
            {/* VIDEO DEMO MODAL */}
            <AnimatePresence>
                {showDemo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 backdrop-blur-2xl p-4 md:p-10"
                        onClick={() => setShowDemo(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(34,211,238,0.2)]"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setShowDemo(false)}
                                className="absolute top-6 right-6 z-110 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all active:scale-95"
                            >
                                <X size={24} />
                            </button>

                            {/* Using a high-quality cinematic tech video from a reliable CDN */}
                            <video
                                src="https://player.vimeo.com/progressive_redirect/playback/710665518/rendition/1080p/file.mp4?loc=external&signature=5212354a3a60a9c682705952ae64369e84360e6f5c88c7f5c88c7f5c88c7f5c8"
                                className="w-full h-full object-cover"
                                autoPlay
                                controls
                                playsInline
                            />

                            <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between pointer-events-none">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(6,182,212,1)]" />
                                    <span className="text-xs font-black uppercase tracking-widest text-white/50">AdAlchemist Intelligence Engine v2.4</span>
                                </div>
                                <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Neural Interface Demo</div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
