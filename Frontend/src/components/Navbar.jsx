import { DollarSignIcon, FolderEditIcon, GalleryHorizontalEnd, SparkleIcon, Receipt, Coins, Palette, Home, Users } from 'lucide-react';
import { GhostButton, PrimaryButton } from './Buttons';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useClerk, useUser, UserButton, useAuth } from '@clerk/clerk-react';
import api from '../configs/axios';
import toast from 'react-hot-toast';
import { SpinCountdownBadge, SpinWheelModal } from './SpinWheel';


export default function Navbar() {

    const navigate = useNavigate();
    const { user } = useUser();
    const { openSignIn, openSignUp } = useClerk();
    const [credits, setCredits] = useState(0);
    const [spinOpen, setSpinOpen] = useState(false);

    const { pathname } = useLocation();
    const { getToken } = useAuth();

    const navLinks = user ? [
        { name: 'Home', href: '/#' },
        { name: 'Create', href: '/generate' },
        { name: 'Community', href: '/community' },
        { name: 'Creator Lounge', href: '/creator-lounge' },
        { name: 'Brand Hub', href: '/brand-hub' },
        { name: 'My Generations', href: '/my-generations' },
        { name: 'Plans', href: '/plans' },
    ] : [];

    const getCredits = async () => {
        try {
            const token = await getToken();
            const { data } = await api.get('/api/user/credits', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setCredits(data.credits);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to fetch credits');
        }
    }

    useEffect(() => {
        if (user) {
            (async () => await getCredits())();
        }
    }, [user, pathname])

    return (
        <>
            <motion.nav className='fixed top-5 left-0 right-0 z-50 px-4'
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1 }}
            >
                <div className='max-w-6xl mx-auto flex items-center justify-between bg-black/50 backdrop-blur-md border border-white/4 rounded-2xl p-2 md:p-3'>
                    <div className='flex items-center gap-4'>
                        <Link to='/' onClick={() => scrollTo(0, 0)}>
                            <div className="relative flex items-center gap-3 group px-4 py-2 rounded-2xl transition-all duration-500 hover:bg-white/[0.03]">
                                {/* Animated Core Icon */}
                                <div className="relative">
                                    <div className="absolute -inset-1 bg-gradient-to-tr from-cyan-500 to-fuchsia-500 rounded-lg blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                                    <div className="relative w-9 h-9 bg-black rounded-lg border border-white/20 flex items-center justify-center shadow-2xl group-hover:border-cyan-500/50 group-hover:scale-110 transition-all duration-500 overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-fuchsia-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <SparkleIcon size={20} className="text-cyan-400 group-hover:rotate-45 group-hover:scale-125 transition-all duration-500" />
                                    </div>
                                </div>

                                {/* Typography */}
                                <div className="flex flex-col items-start leading-none">
                                    <div className="flex items-center">
                                        <span className="text-xl md:text-2xl font-black tracking-tighter bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent group-hover:from-cyan-400 group-hover:to-white transition-all duration-500">
                                            Ad
                                        </span>
                                        <span className="text-xl md:text-2xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                                            Alchemist
                                        </span>
                                        <div className="ml-1.5 w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(6,182,212,0.8)]" />
                                    </div>
                                    <div className="mt-0.5 h-[1px] w-0 group-hover:w-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 transition-all duration-500 rounded-full" />
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className='hidden md:flex items-center gap-8 text-sm font-medium text-gray-300'>
                        {navLinks.map((link) => (
                            <Link to={link.href} onClick={() => scrollTo(0, 0)} key={link.name} className="hover:text-white transition">
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    <div className='flex items-center gap-2 md:gap-5'>
                        {!user ? (
                            <div className="flex items-center gap-2 md:gap-3">
                                <Link to="/community" className="group flex items-center gap-2 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all active:scale-95">
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-500 group-hover:bg-cyan-500 group-hover:text-black transition-all">
                                        <Users size={14} />
                                    </div>
                                    <span className="text-[10px] md:text-xs font-bold text-gray-300 group-hover:text-white transition-colors hidden sm:block">Community</span>
                                </Link>

                                <Link to="/creator-lounge" className="group flex items-center gap-2 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all active:scale-95">
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-black transition-all">
                                        <SparkleIcon size={14} />
                                    </div>
                                    <span className="text-[10px] md:text-xs font-bold text-gray-300 group-hover:text-white transition-colors hidden sm:block">Creator Lounge</span>
                                </Link>

                                <div className="w-px h-4 bg-white/10 mx-1 hidden md:block" />

                                <button onClick={() => openSignIn()} className='text-sm font-medium text-gray-300 hover:text-white transition hidden md:block px-2'>
                                    Sign in
                                </button>
                                <PrimaryButton onClick={() => openSignUp()} className='text-xs sm:text-sm px-4 py-2 shrink-0'>Get Started</PrimaryButton>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 md:gap-3">
                                <button
                                    onClick={() => navigate('/plans')}
                                    className="group flex items-center gap-2 px-2 md:px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all active:scale-95"
                                >
                                    <div className="flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-full bg-yellow-500/20 text-yellow-500 group-hover:bg-yellow-500 group-hover:text-black transition-all">
                                        <Coins size={12} className="md:hidden" />
                                        <Coins size={14} className="hidden md:block" />
                                    </div>
                                    <div className="flex flex-col items-start leading-none">
                                        <span className="text-[7px] md:text-[8px] font-bold text-gray-500 uppercase tracking-tighter">Credits</span>
                                        <span className="text-[10px] md:text-xs font-black text-white">{credits}</span>
                                    </div>
                                </button>

                                {/* Spin Countdown Badge (Visible on all sizes but refined) */}
                                <SpinCountdownBadge onOpenWheel={() => setSpinOpen(true)} />

                                <UserButton
                                    appearance={{
                                        layout: {
                                            branding: false,
                                            shimmer: true,
                                        },
                                        elements: {
                                            userButtonPopoverCard: 'bg-[#0f0f13] border border-white/10 shadow-2xl rounded-2xl overflow-hidden',
                                            userButtonPopoverActionButton: 'hover:bg-white/5 transition-all py-3 px-4',
                                            userButtonPopoverActionButtonText: 'text-gray-300 font-medium text-xs',
                                            userButtonPopoverActionButtonIcon: 'text-cyan-400',
                                            userPreviewSecondaryIdentifier: 'text-gray-500 text-[10px]',
                                            userPreviewMainIdentifier: 'text-white text-sm font-bold',
                                            userButtonTrigger: 'focus:shadow-none focus:outline-none hover:opacity-80 transition-opacity',
                                            navbarButton__billing: 'hidden',
                                            userButtonPopoverFooter: { display: 'none' },
                                        }
                                    }}>
                                    <UserButton.MenuItems>
                                        <UserButton.Action label='Generate' labelIcon={<SparkleIcon size={14} />} onClick={() => navigate('/generate')} />
                                        <UserButton.Action label='Brand Hub' labelIcon={<Palette size={14} />} onClick={() => navigate('/brand-hub')} />
                                        <UserButton.Action label='My Generations' labelIcon={<FolderEditIcon size={14} />} onClick={() => navigate('/my-generations')} />
                                        <UserButton.Action label='Community' labelIcon={<GalleryHorizontalEnd size={14} />} onClick={() => navigate('/community')} />
                                        <UserButton.Action label='Creator Lounge' labelIcon={<SparkleIcon size={14} />} onClick={() => navigate('/creator-lounge')} />
                                        <UserButton.Action label='Plans' labelIcon={<DollarSignIcon size={14} />} onClick={() => navigate('/plans')} />
                                        <UserButton.Action label='Billing' labelIcon={<Receipt size={14} />} onClick={() => navigate('/billing')} />
                                    </UserButton.MenuItems>
                                </UserButton>
                            </div>
                        )}
                    </div>
                </div>

            </motion.nav>


            <SpinWheelModal isOpen={spinOpen} onClose={() => setSpinOpen(false)} />
        </>
    );
};
