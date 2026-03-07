import React, { useEffect } from 'react';
import Title from '../components/Title';

const PrivacyPolicy = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen text-white pt-32 pb-20 px-6">
            <div className="max-w-4xl mx-auto space-y-12">
                <Title
                    heading="Privacy Policy"
                    description="Last updated: February 24, 2026"
                />

                <div className="glass-panel p-8 md:p-12 rounded-3xl border border-white/10 bg-white/[0.02] space-y-8 text-gray-300 leading-relaxed">
                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-sm">01</span>
                            Information We Collect
                        </h2>
                        <p>
                            We collect information you provide directly to us when you create an account, use our services, or communicate with us. This includes your name, email address, and any images or branding assets you upload for ad generation.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-sm">02</span>
                            How We Use Your Information
                        </h2>
                        <p>
                            Your information is used to provide, maintain, and improve our AI ad generation services. We use the images you upload solely for generating the advertisements you request. We do not sell your personal data to third parties.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-sm">03</span>
                            Data Security
                        </h2>
                        <p>
                            We implement industry-standard security measures to protect your data. All uploaded images are processed through secure AI pipelines and stored with encryption. However, no method of transmission over the internet is 100% secure.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-sm">04</span>
                            Cookies & Tracking
                        </h2>
                        <p>
                            We use essential cookies to maintain your session and preference settings. We may also use analytics tools to understand how our platform is being used to improve our features.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
