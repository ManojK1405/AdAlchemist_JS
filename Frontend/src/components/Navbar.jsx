import { DollarSignIcon, FolderEditIcon, GalleryHorizontalEnd, MenuIcon, SparkleIcon, XIcon, Receipt } from 'lucide-react';
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
    const [isOpen, setIsOpen] = useState(false);
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
                    <div>
                        <div className='hidden md:flex items-center gap-3'>
                            <button onClick={() => openSignIn()} className='text-sm font-medium text-gray-300 hover:text-white transition max-sm:hidden'>
                                Sign in
                            </button>
                            <PrimaryButton onClick={() => openSignUp()} className='max-sm:text-xs hidden sm:inline-block'>Get Started</PrimaryButton>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <GhostButton onClick={() => navigate('/plans')} className="border-none text-gray-300 sm:py-1.5 max-sm:px-2 max-sm:text-[10px] max-sm:bg-transparent">
                            <span className="hidden sm:inline">Credits:</span> {credits}
                        </GhostButton>

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
                                onClick={() => navigate('/my-generations')}
                                className="p-2 rounded-full bg-white/10 text-gray-300 active:scale-95 transition-transform"
                                title="My Generations"
                            >
                                <FolderEditIcon size={16} />
                            </button>

                            <button
                                onClick={() => navigate('/community')}
                                className="p-2 rounded-full bg-white/10 text-gray-300 active:scale-95 transition-transform"
                                title="Community"
                            >
                                <GalleryHorizontalEnd size={16} />
                            </button>
                        </div>

                        <UserButton userProfileProps={{
                            appearance: {
                                elements: {
                                    navbarButton__billing: 'hidden',
                                }
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

                <button onClick={() => setIsOpen(!isOpen)} className='md:hidden p-1 text-gray-400 hover:text-white transition'>
                    <MenuIcon className='size-6' />
                </button>
            </div>
            <div className={`flex flex-col items-center justify-center gap-6 text-xl font-semibold fixed inset-0 bg-black/90 backdrop-blur-xl z-50 transition-all duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
                <div className="absolute top-8 left-8">
                    <span className="text-2xl font-extrabold tracking-wide text-gray-500">
                        Ad<span className="bg-linear-to-r from-cyan-600 to-indigo-600 bg-clip-text text-transparent">Alchemist</span>
                    </span>
                </div>

                {navLinks.map((link) => (
                    <Link key={link.name} to={link.href} onClick={() => setIsOpen(false)} className={`${pathname === link.href ? 'text-cyan-500' : 'text-gray-300'} hover:text-white transition-colors`}>
                        {link.name}
                    </Link>
                ))}

                {!user ? (
                    <div className="flex flex-col gap-4 w-full px-12 mt-4">
                        <button onClick={() => { setIsOpen(false); openSignIn(); }} className='text-lg font-medium text-gray-300 hover:text-white transition'>
                            Sign in
                        </button>
                        <PrimaryButton onClick={() => { setIsOpen(false); openSignUp(); }} className="w-full text-lg py-3">Get Started</PrimaryButton>
                    </div>
                ) : (
                    <div className="mt-8">
                        <PrimaryButton onClick={() => { setIsOpen(false); navigate('/generate'); }} className="text-lg py-3 px-8">
                            <SparkleIcon size={20} /> Create New Ad
                        </PrimaryButton>
                    </div>
                )}

                <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-md bg-white p-2 text-gray-800 ring-white active:ring-2"
                >
                    <XIcon />
                </button>
            </div>
        </motion.nav>
    );
};
