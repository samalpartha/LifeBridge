"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Search, Send, Shield, Sparkles, X, MessageCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

// Types
type Message = {
    id: string;
    role: "assistant" | "user";
    text: string;
    isTyping?: boolean;
};

export default function SamaritanChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            role: "assistant",
            text: "Hi, I'm Samaritan. I can help you navigate this case or answer questions about immigration forms. How can I support you today?",
        },
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const router = useRouter();

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    // Context Awareness (Triggered on page change)
    useEffect(() => {
        if (pathname === "/attorneys") {
            addAssistantMessage("I see you're looking for an attorney. Would you like me to help you find a pro-bono lawyer in your area?");
        } else if (pathname === "/vault") {
            addAssistantMessage("This is your secure Vault. You can upload essential documents like your Passport or Birth Certificate here.");
        }
    }, [pathname]);

    const addAssistantMessage = (text: string) => {
        // Prevent duplicate adjacent messages
        setMessages((prev) => {
            if (prev[prev.length - 1].text === text) return prev;
            return [...prev, { id: Date.now().toString(), role: "assistant", text }];
        });
    };

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), role: "user", text: inputValue };
        setMessages((prev) => [...prev, userMsg]);
        setInputValue("");
        setIsTyping(true);

        // Real AI Call
        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMsg.text })
            });

            let responseText = "I'm having trouble connecting right now.";
            if (res.ok) {
                const data = await res.json();
                responseText = data.response;
            }

            setMessages((prev) => [...prev, { id: Date.now().toString(), role: "assistant", text: responseText }]);

            // Smart Navigation (Client-side trigger based on AI response content)
            const lowerResp = responseText.toLowerCase();
            if (lowerResp.includes("attorney") || lowerResp.includes("network")) {
                setTimeout(() => router.push("/attorneys"), 3000);
            }
            if (lowerResp.includes("resource") || lowerResp.includes("guide") || lowerResp.includes("vault")) {
                if (lowerResp.includes("vault")) setTimeout(() => router.push("/vault"), 3000);
                else setTimeout(() => router.push("/resources"), 3000);
            }

        } catch (e) {
            console.error(e);
            setMessages((prev) => [...prev, { id: Date.now().toString(), role: "assistant", text: "Connection error. Please try again." }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSend();
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="mb-4 w-96 bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl overflow-hidden pointer-events-auto ring-1 ring-black/5"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                                    <div className="relative">
                                        <Heart className="w-5 h-5 text-pink-200 fill-pink-200" />
                                        <Shield className="w-4 h-4 text-white absolute -bottom-1 -right-1" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-sm">Samaritan</h3>
                                    <div className="flex items-center space-x-1">
                                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                        <span className="text-blue-100 text-xs">Verified AI Assistant</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-white/80 hover:text-white transition-colors"
                                aria-label="Close Chat"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="h-80 overflow-y-auto p-4 space-y-4 bg-white/50">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm ${msg.role === "assistant"
                                            ? "bg-white text-gray-800 rounded-tl-none border border-gray-100"
                                            : "bg-blue-600 text-white rounded-tr-none"
                                            }`}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            ))}

                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm border border-gray-100 flex items-center space-x-2">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                        <span className="ml-2 text-xs text-gray-400 font-medium flex items-center">
                                            <Search className="w-3 h-3 mr-1" />
                                            Sourcing info...
                                        </span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-white border-t border-gray-100">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask me anything..."
                                    className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!inputValue.trim() || isTyping}
                                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="mt-2 text-center">
                                <p className="text-[10px] text-gray-400 flex items-center justify-center">
                                    <Sparkles className="w-3 h-3 mr-1 text-blue-400" />
                                    Powered by LifeBridge AI
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="pointer-events-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all ring-2 ring-white/50 relative group"
                aria-label="Toggle Samaritan Chat"
            >
                <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                {isOpen ? <X className="w-7 h-7" /> : (
                    <div className="relative">
                        <Heart className="w-7 h-7 fill-current" />
                        <div className="absolute -top-1 -right-1 bg-red-500 w-3 h-3 rounded-full border-2 border-white" />
                    </div>
                )}
            </motion.button>
        </div>
    );
}
