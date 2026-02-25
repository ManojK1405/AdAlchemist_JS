import { DollarSignIcon, FolderEditIcon, GalleryHorizontalEnd, SparkleIcon, Receipt, Coins } from 'lucide-react';
import { GhostButton, PrimaryButton } from './Buttons';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useClerk, useUser, UserButton, useAuth } from '@clerk/clerk-react';
import api from '../configs/axios';
import toast from 'react-hot-toast';


export default function Navbar() {

    const navigate = useNavigate();
    const { user } = useUser();
    const { openSignIn, openSignUp } = useClerk();
    const [credits, setCredits] = useState(0);

    const { pathname } = useLocation();
    const { getToken } = useAuth();

    const navLinks = [
        { name: 'Home', href: '/#' },
        { name: 'Create', href: '/generate' },
        { name: 'Community', href: '/community' },
        { name: 'Creator Lounge', href: '/creator-lounge' },
        { name: 'Plans', href: '/plans' },
        ...(user ? [
            { name: 'My Generations', href: '/my-generations' },
            { name: 'Billing', href: '/billing' }
        ] : [])
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
        <motion.nav className='fixed top-5 left-0 right-0 z-50 px-4'
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1 }}
        >
            <div className='max-w-6xl mx-auto flex items-center justify-between bg-black/50 backdrop-blur-md border border-white/4 rounded-2xl p-3'>
                <Link to='/' onClick={() => scrollTo(0, 0)}>
                    <span className="text-xl font-extrabold tracking-wide text-gray-500">
                        Ad<span className="bg-linear-to-r from-cyan-600 to-indigo-600 bg-clip-text text-transparent">Alchemist</span>
                    </span>
                </Link>

                <div className='hidden md:flex items-center gap-8 text-sm font-medium text-gray-300'>
                    {navLinks.map((link) => (
                        <Link to={link.href} onClick={() => scrollTo(0, 0)} key={link.name} className="hover:text-white transition">
                            {link.name}
                        </Link>
                    ))}
                </div>

                {!user ? (
                    <div className="flex items-center gap-3 md:gap-5">
                        {/* Quick Action Buttons for Mobile (Logged Out) */}
                        <div className="md:hidden flex items-center gap-1.5">
                            <button
                                onClick={() => navigate('/creator-lounge')}
                                className="p-2 rounded-full bg-linear-to-r from-cyan-600 to-indigo-600 text-white active:scale-95 transition-transform"
                                title="Creator Lounge"
                            >
                                <SparkleIcon size={16} />
                            </button>
                            <button
                                onClick={() => navigate('/community')}
                                className="p-2 rounded-full bg-white/10 text-gray-300 active:scale-95 transition-transform"
                                title="Community"
                            >
                                <GalleryHorizontalEnd size={16} />
                            </button>
                        </div>
                        <button onClick={() => openSignIn()} className='text-sm font-medium text-gray-300 hover:text-white transition hidden md:block'>
                            Sign in
                        </button>
                        <PrimaryButton onClick={() => openSignUp()} className='text-xs sm:text-sm px-4 py-2 hidden xs:block'>Get Started</PrimaryButton>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('/plans')}
                            className="group flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all active:scale-95"
                        >
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-500 group-hover:bg-yellow-500 group-hover:text-black transition-all">
                                <Coins size={14} />
                            </div>
                            <div className="flex flex-col items-start leading-none">
                                <span className="text-[8px] font-bold text-gray-500 uppercase tracking-tighter">Credits</span>
                                <span className="text-xs font-black text-white">{credits}</span>
                            </div>
                        </button>

                        {/* Quick Action Buttons for Mobile */}
                        <div className="md:hidden flex items-center gap-1.5">
                            <button
                                onClick={() => navigate('/generate')}
                                className="p-2 rounded-full bg-linear-to-r from-cyan-600 to-indigo-600 text-white active:scale-95 transition-transform"
                                title="Create New Ad"
                            >
                                <SparkleIcon size={16} />
                            </button>
                            <button
                                onClick={() => navigate('/community')}
                                className="p-2 rounded-full bg-white/10 text-gray-300 active:scale-95 transition-transform"
                                title="Community"
                            >
                                <GalleryHorizontalEnd size={16} />
                            </button>
                        </div>

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
                                    userButtonPopoverFooter: { display: 'none' }, // Hides footer specifically in UserButton
                                }
                            }}>
                            <UserButton.MenuItems>
                                <UserButton.Action label='Generate' labelIcon={<SparkleIcon size={14} />} onClick={() => navigate('/generate')} />

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
        </motion.nav>
    );
};
