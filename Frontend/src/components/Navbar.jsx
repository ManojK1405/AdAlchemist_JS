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

    const navLinks = [
        { name: 'Home', href: '/#' },
        { name: 'Create', href: '/generate' },
        { name: 'Community', href: '/community' },
        { name: 'Creator Lounge', href: '/creator-lounge' },
        ...(user ? [
            { name: 'Brand Hub', href: '/brand-hub' },
            { name: 'My Generations', href: '/my-generations' },
        ] : []),
        { name: 'Plans', href: '/plans' },
    ];

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
                            <span className="text-lg md:text-xl font-extrabold tracking-wide text-gray-500">
                                Ad<span className="bg-linear-to-r from-cyan-600 to-indigo-600 bg-clip-text text-transparent">Alchemist</span>
                            </span>
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
                            <div className="flex items-center gap-3">
                                <button onClick={() => openSignIn()} className='text-sm font-medium text-gray-300 hover:text-white transition hidden md:block'>
                                    Sign in
                                </button>
                                <PrimaryButton onClick={() => openSignUp()} className='text-xs sm:text-sm px-4 py-2'>Get Started</PrimaryButton>
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

                {/* Mobile Dash-Grid (Stable & No Scrolling) */}
                <div className={`md:hidden mt-3 p-1 grid ${user ? 'grid-cols-4' : 'grid-cols-3'} gap-1.5`}>
                    {[
                        { name: 'Home', icon: <Home size={16} />, href: '/' },
                        { name: 'Create', icon: <SparkleIcon size={16} />, href: '/generate', primary: true },
                        { name: 'Lounge', icon: <GalleryHorizontalEnd size={16} />, href: '/creator-lounge' },
                        ...(user ? [
                            { name: 'Brand Hub', icon: <Palette size={16} />, href: '/brand-hub' },
                            { name: 'Archive', icon: <FolderEditIcon size={16} />, href: '/my-generations' },
                            { name: 'Community', icon: <Users size={16} />, href: '/community' },
                            { name: 'Plans', icon: <Receipt size={16} />, href: '/plans' },
                        ] : [
                            { name: 'Community', icon: <Users size={16} />, href: '/community' },
                            { name: 'Plans', icon: <Receipt size={16} />, href: '/plans' },
                        ]),
                    ].map((link) => (
                        <Link
                            key={link.name}
                            to={link.href}
                            onClick={() => scrollTo(0, 0)}
                            className={`flex flex-col items-center justify-center py-2.5 rounded-2xl transition-all active:scale-90 relative overflow-hidden ${pathname === link.href
                                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'
                                    : link.primary
                                        ? 'bg-linear-to-br from-cyan-600 to-indigo-600 border-none text-white shadow-lg shadow-cyan-500/10'
                                        : 'bg-white/5 border border-white/5 text-gray-400 active:bg-white/10'
                                }`}
                        >
                            <div className="mb-0.5">
                                {link.icon}
                            </div>
                            <span className="text-[8px] font-bold uppercase tracking-tight scale-90 origin-center truncate w-full text-center px-1">
                                {link.name}
                            </span>
                        </Link>
                    ))}
                </div>
            </motion.nav>

            <SpinWheelModal isOpen={spinOpen} onClose={() => setSpinOpen(false)} />
        </>
    );
};
