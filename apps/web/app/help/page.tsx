"use client";

import {
    Map,
    ShieldCheck,
    Compass,
    BookOpen,
    MessageCircle,
    CheckCircle2
} from "lucide-react";
import Link from 'next/link';

export default function HelpPage() {
    const guides = [
        {
            icon: Compass,
            title: "The Checklist is your Map",
            description: "Imagine you are going on a long hike. The Checklist tells you exactly where to go next, so you don't get lost.",
            color: "text-blue-500",
            bg: "bg-blue-50",
            link: "/knowledge/checklist"
        },
        {
            icon: ShieldCheck,
            title: "The Vault is your Safe Box",
            description: "You know how you keep valuable things in a safe? The Vault is a secure digital box for all your important papers like Passports and Visas.",
            color: "text-purple-500",
            bg: "bg-purple-50",
            link: "/vault"
        },
        {
            icon: CheckCircle2,
            title: "The Tracker is your To-Do List",
            description: "This is your personal assistant. It remembers dates and tasks for you, so you don't have to carry everything in your head.",
            color: "text-green-500",
            bg: "bg-green-50",
            link: "/tracker"
        },
        {
            icon: BookOpen,
            title: "Knowledge Base is the Library",
            description: "Have a tricky question? Go to the library. This section has answers to thousands of immigration questions.",
            color: "text-orange-500",
            bg: "bg-orange-50",
            link: "/knowledge"
        }
    ];

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
                        Welcome to LifeBridge! 👋
                    </h1>
                    <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                        We know immigration allows can be confusing. Here is a simple guide to help you get started.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-16">
                    {guides.map((guide) => (
                        <Link key={guide.title} href={guide.link} className="group cursor-pointer">
                            <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition flex items-start gap-6 h-full hover:border-blue-200">
                                <div className={`w-16 h-16 ${guide.bg} rounded-2xl flex items-center justify-center shrink-0`}>
                                    <guide.icon size={32} className={guide.color} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition">
                                        {guide.title}
                                    </h3>
                                    <p className="text-gray-500 leading-relaxed text-lg">
                                        {guide.description}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Who is this for? */}
                <div className="mb-16">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Who is LifeBridge for?</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-blue-50 p-6 rounded-2xl">
                            <span className="text-2xl mb-4 block">🎓</span>
                            <h3 className="font-bold text-gray-900 mb-2">Students</h3>
                            <p className="text-sm text-gray-600">Navigating F-1 visas, OPT applications, and university admissions in a new country.</p>
                        </div>
                        <div className="bg-purple-50 p-6 rounded-2xl">
                            <span className="text-2xl mb-4 block">💼</span>
                            <h3 className="font-bold text-gray-900 mb-2">Professionals</h3>
                            <p className="text-sm text-gray-600">Managing H-1B, O-1, or Green Card timelines while balancing a busy career.</p>
                        </div>
                        <div className="bg-green-50 p-6 rounded-2xl">
                            <span className="text-2xl mb-4 block">🌍</span>
                            <h3 className="font-bold text-gray-900 mb-2">Global Citizens</h3>
                            <p className="text-sm text-gray-600">Digital nomads and travelers organizing visas, travel history, and tax documents.</p>
                        </div>
                    </div>
                </div>

                {/* Application Flow */}
                <div className="mb-16">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">How does it work?</h2>
                    <div className="relative border-l-2 border-dashed border-gray-200 ml-4 md:ml-0 md:pl-0 md:border-l-0 md:border-t-2 md:grid md:grid-cols-4 md:gap-4 md:pt-8">
                        <div className="mb-8 ml-6 md:ml-0 md:mb-0 relative">
                            <div className="absolute -left-[31px] top-0 md:left-0 md:-top-[41px] bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ring-4 ring-white">1</div>
                            <h4 className="font-bold text-gray-900">Choose a Goal</h4>
                            <p className="text-sm text-gray-500 mt-1">Start with the <strong>Checklist</strong> to select your path (e.g., Work Visa).</p>
                        </div>
                        <div className="mb-8 ml-6 md:ml-0 md:mb-0 relative">
                            <div className="absolute -left-[31px] top-0 md:left-0 md:-top-[41px] bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ring-4 ring-white">2</div>
                            <h4 className="font-bold text-gray-900">Follow Steps</h4>
                            <p className="text-sm text-gray-500 mt-1">Convert checklist steps into actionable <strong>Tasks</strong> in your Tracker.</p>
                        </div>
                        <div className="mb-8 ml-6 md:ml-0 md:mb-0 relative">
                            <div className="absolute -left-[31px] top-0 md:left-0 md:-top-[41px] bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ring-4 ring-white">3</div>
                            <h4 className="font-bold text-gray-900">Secure Docs</h4>
                            <p className="text-sm text-gray-500 mt-1">Upload required proofs directly to your secure <strong>Vault</strong>.</p>
                        </div>
                        <div className="mb-8 ml-6 md:ml-0 md:mb-0 relative">
                            <div className="absolute -left-[31px] top-0 md:left-0 md:-top-[41px] bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ring-4 ring-white">4</div>
                            <h4 className="font-bold text-gray-900">Success</h4>
                            <p className="text-sm text-gray-500 mt-1">Track your case status and travel history until you reach your goal.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-3xl p-8 md:p-12 text-center">
                    <div className="inline-flex items-center justify-center p-3 bg-white rounded-xl shadow-sm mb-6">
                        <MessageCircle size={24} className="text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Still confused?</h2>
                    <p className="text-gray-500 max-w-lg mx-auto mb-8">
                        It's okay to ask for help! You can find a professional attorney or chat with our AI assistant anytime.
                    </p>
                    <Link
                        href="/attorneys"
                        className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition"
                    >
                        Find an Attorney
                    </Link>
                </div>
            </div>
        </div>
    );
}
