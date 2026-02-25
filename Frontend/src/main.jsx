import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'

// Import your Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
    throw new Error('Add your Clerk Publishable Key to the .env file')
}

createRoot(document.getElementById('root')).render(
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}
        appearance={{
            theme: dark,
            layout: {
                branding: false,
                shimmer: true,
            },
            variables: {
                colorPrimary: '#0891b2',
                colorTextOnPrimaryBackground: "#ffffff",
                colorBackground: '#0a0a0c',
                colorTextSecondary: '#444444',
                borderRadius: '1rem',
                fontFamily: 'Inter, sans-serif'
            },
            elements: {
                card: 'bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl',
                formButtonPrimary: 'bg-gradient-to-r from-cyan-600 to-indigo-600 border-none hover:opacity-90 transition-all font-bold uppercase tracking-widest text-xs py-3',
                headerTitle: 'text-2xl font-bold tracking-tight',
                headerSubtitle: 'text-gray-400',
                socialButtonsBlockButton: 'bg-white/5 border-white/10 hover:bg-white/10 transition-colors',
                socialButtonsBlockButtonText: 'font-semibold',
                formFieldInput: 'bg-white/5 border-white/10 focus:border-cyan-500/50 transition-all',
                footerActionLink: 'text-cyan-400 hover:text-cyan-300 font-bold',
                dividerLine: 'bg-white/10',
                dividerText: 'text-gray-500 text-[10px] uppercase font-bold tracking-widest',
                footer: 'hidden',
                userButtonPopoverFooter: 'hidden',
                footerAction: 'hidden',
            }
        }}>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </ClerkProvider>
)
