import { UploadIcon, VideoIcon, ZapIcon } from 'lucide-react';

export const featuresData = [
    {
        icon: <UploadIcon className="w-6 h-6" />,
        title: 'Smart Upoad',
        desc: 'Simply drag and drop your files..we optimize and deliver a high-quality product that meets your needs.'
    },
    {
        icon: <ZapIcon className="w-6 h-6" />,
        title: 'Instant Generation',
        desc: 'Optimized model delivers high-quality results in seconds.'
    },
    {
        icon: <VideoIcon className="w-6 h-6" />,
        title: 'Video Synthesis',
        desc: 'Bring product shots to life with realistic animations.'
    }
];


export const faqData = [
    {
        question: 'What is AdAlchemist?',
        answer:
            'AdAlchemist is an AI-powered platform that generates high-quality static and video advertisements using your product and model images.'
    },
    {
        question: 'Do I need any design or video editing skills?',
        answer:
            'No. AdAlchemist handles design, composition, and animation automatically, so anyone can create professional ads in minutes.'
    },
    {
        question: 'What types of ads can I create?',
        answer:
            'You can create static image ads and short-form video ads optimized for platforms like Instagram, Facebook, and YouTube.'
    },
    {
        question: 'How do credits work?',
        answer:
            'Each ad generation uses credits based on the type and resolution of the ad. Higher-quality and video ads consume more credits.'
    },
    {
        question: 'Can I use the ads for commercial purposes?',
        answer:
            'Yes. All generated ads are royalty-free and can be used commercially without any watermark.'
    }
];


export const footerLinks = [
    {
        title: "Quick Links",
        links: [
            { name: "Home", url: "/" },
            { name: "Features", url: "/features" },
            { name: "Prices", url: "/plans" },
            { name: "FAQ", url: "/faq" }
        ]
    },
    {
        title: "Legal",
        links: [
            { name: "Privacy Policy", url: "/privacy" },
            { name: "Terms of Service", url: "/terms" }
        ]
    },
    {
        title: "Connect",
        links: [
            { name: "Email", url: "mailto:manojadalchemist@gmail.com" },
            { name: "GitHub", url: "https://github.com/ManojK1405/AdAlchemist_JS" }
        ]
    }
];
