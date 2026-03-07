import React, { useEffect } from 'react';
import Title from '../components/Title';

const TermsOfService = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen text-white pt-32 pb-20 px-6">
            <div className="max-w-4xl mx-auto space-y-12">
                <Title
                    heading="Terms of Service"
                    description="Last updated: February 24, 2026"
                />

                <div className="glass-panel p-8 md:p-12 rounded-3xl border border-white/10 bg-white/[0.02] space-y-8 text-gray-300 leading-relaxed">
                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-3">
                            Acceptance of Terms
                        </h2>
                        <p>
                            By accessing or using AdAlchemist, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use our services.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-3">
                            Usage Policy & Ownership
                        </h2>
                        <ul className="list-disc list-inside space-y-2">
                            <li>You retain ownership of the original images you upload.</li>
                            <li>You receive full commercial rights to the AI-generated content produced via your account.</li>
                            <li>You are responsible for ensuring your uploaded content does not violate any third-party rights.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-3">
                            Credits & Payments
                        </h2>
                        <p>
                            AdAlchemist operates on a credit-based system. Credits are purchased via our payment gateway. Once used for generation, credits are non-refundable. Paid plans and credits are subject to the specific pricing displayed at the time of purchase.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-3">
                            Prohibited Conduct
                        </h2>
                        <p>
                            You agree not to use AdAlchemist to generate deepfakes, non-consensual imagery, extreme violence, or any content that violates applicable laws. We reserve the right to terminate accounts that violate these guidelines.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
