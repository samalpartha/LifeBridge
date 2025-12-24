"use client";

import Link from "next/link";
import { useAuth } from "../contexts/auth-context";

export default function ResourcesPage() {
    const { user } = useAuth();

    const resources = [
        {
            category: "Self-Help Guides",
            icon: (
                <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            ),
            items: [
                { title: "How to File Form I-130", desc: "Step-by-Step guide for family petitions.", link: "#" },
                { title: "Understanding Visa Bulletins", desc: "Decode priority dates and waiting times.", link: "#" },
                { title: "Preparing for an Interview", desc: "What to bring and what to expect at the consulate.", link: "#" },
            ],
        },
        {
            category: "Official Forms (USCIS)",
            icon: (
                <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            items: [
                { title: "I-130 Petition for Alien Relative", desc: "Download PDF directly from USCIS.", link: "https://www.uscis.gov/i-130" },
                { title: "I-485 Adjustment of Status", desc: "Application to register permanent residence.", link: "https://www.uscis.gov/i-485" },
                { title: "G-1145 E-Notification", desc: "Sign up for email/text notifications.", link: "https://www.uscis.gov/g-1145" },
            ],
        },
        {
            category: "Community Support",
            icon: (
                <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            items: [
                { title: "Find Low-Cost Legal Aid", desc: "Search the DOJ accredited representatives list.", link: "https://www.justice.gov/eoir/find-legal-representation" },
                { title: "Know Your Rights", desc: "Guides for interacting with immigration officers.", link: "#" },
                { title: "Local Shelters & Food Banks", desc: "Essential resources for new arrivals.", link: "#" },
            ],
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Hero Section */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl text-gradient">
                        Resource Library
                    </h1>
                    <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
                        Empower yourself with knowledge. Access verified guides, official forms, and community support to navigate your journey.
                    </p>
                </div>
            </div>

            {/* Content Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid gap-12 lg:grid-cols-3 lg:gap-8">
                    {resources.map((category) => (
                        <div key={category.category} className="space-y-6">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm ring-1 ring-gray-900/5">
                                    {category.icon}
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">{category.category}</h3>
                            </div>
                            <ul className="space-y-4">
                                {category.items.map((item) => (
                                    <li key={item.title}>
                                        <a
                                            href={item.link}
                                            target={item.link.startsWith("http") ? "_blank" : "_self"}
                                            rel="noopener noreferrer"
                                            className="group block p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow ring-1 ring-gray-900/5 hover:ring-blue-500"
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                    {item.title}
                                                </span>
                                                <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                            <p className="text-sm text-gray-500">{item.desc}</p>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-blue-600 rounded-2xl shadow-xl overflow-hidden">
                    <div className="px-6 py-12 md:p-12 text-center">
                        <h2 className="text-2xl font-bold text-white mb-4">Need Professional Help?</h2>
                        <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
                            Sometimes self-help isn't enough. Connect with verified immigration attorneys who can review your case.
                        </p>
                        <Link href="/attorneys" className="btn bg-white text-blue-600 hover:bg-blue-50 border-none">
                            Find an Attorney
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
