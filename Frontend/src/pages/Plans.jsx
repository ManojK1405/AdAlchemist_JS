import { useState } from "react"
import Pricing from "../components/Pricing"
import { SpinWheelModal } from "../components/SpinWheel"
import { Sparkles } from "lucide-react"
import { useUser } from "@clerk/clerk-react"

const Plans = () => {
    const { user } = useUser();
    const [spinOpen, setSpinOpen] = useState(false);

    return (
        <div className="max-sm:py-10 sm:pt-20">
            <Pricing />

            <p className="text-center text-grey-400 max-w-md text-sm my-14 mx-auto px-12">Create Stunning Images For <span className="text-cyan-400 font-medium">10 Credits</span> And Immersive Videos in <span className="text-cyan-400 font-medium">40 Credits</span></p>

            {/* Spin the Wheel CTA */}
            {user && (
                <div className="flex justify-center pb-20">
                    <button
                        onClick={() => setSpinOpen(true)}
                        className="group relative flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-600/20 to-indigo-600/20 hover:from-cyan-600/30 hover:to-indigo-600/30 border border-cyan-500/30 hover:border-cyan-400/50 rounded-2xl transition-all active:scale-95 overflow-hidden"
                    >
                        {/* Animated background shimmer */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                        <Sparkles size={18} className="text-cyan-400 animate-pulse" />
                        <div className="text-left">
                            <p className="text-sm font-black text-white uppercase tracking-widest">Daily Fortune Wheel</p>
                            <p className="text-[10px] text-gray-400">Win free credits & discounts — once per day</p>
                        </div>
                        <div className="ml-2 px-2 py-0.5 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-[9px] font-black text-cyan-400 uppercase tracking-wider">Free</div>
                    </button>
                </div>
            )}

            <SpinWheelModal isOpen={spinOpen} onClose={() => setSpinOpen(false)} />
        </div>
    )
}

export default Plans
