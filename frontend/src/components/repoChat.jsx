import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Mic, Sparkles, Zap, RefreshCw } from "lucide-react";

export default function RepoChat({ question, setQuestion, handleAsk, asking, analysis }) {
    const [isOpen, setIsOpen] = useState(false);

    const onFormSubmit = (e) => {
        e.preventDefault();
        handleAsk(e);
    };

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
            <AnimatePresence mode="wait">
                {isOpen ? (
                    <motion.div
                        key="expanded"
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="w-[95vw] max-w-xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden relative group"
                    >
                        {/* Gradient Border for Expanded State */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur opacity-20 pointer-events-none"></div>

                        <div className="relative bg-white dark:bg-zinc-900 rounded-2xl">
                            {/* Header */}
                            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                        <Sparkles className="w-5 h-5 text-indigo-500" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-sm font-bold dark:text-white">Architecture Advisor</h3>
                                        <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">AI Powered</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-zinc-500" />
                                </button>
                            </div>

                            {/* Response Area */}
                            <div className="p-6 max-h-[300px] overflow-y-auto custom-scrollbar">
                                {analysis?.explanation ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                            <Zap className="w-3 h-3 text-amber-500" /> Current Insights
                                        </div>
                                        <div className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-700/50">
                                            {analysis.explanation}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 text-zinc-400">
                                        <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4">
                                            <MessageCircle className="w-8 h-8 opacity-20" />
                                        </div>
                                        <p className="text-xs italic text-center max-w-xs">
                                            Ask me about zombie APIs, high-risk dependencies, or overall system architecture.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-zinc-50/50 dark:bg-zinc-800/30 border-t border-zinc-100 dark:border-zinc-800">
                                <form onSubmit={onFormSubmit} className="relative">
                                    <div className="p-[1px] rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                                        <input
                                            type="text"
                                            value={question}
                                            onChange={(e) => setQuestion(e.target.value)}
                                            placeholder="Ask about your graph..."
                                            className="w-full pl-6 pr-24 py-3.5 bg-white dark:bg-zinc-900 border-none rounded-full outline-none text-sm text-zinc-700 dark:text-zinc-200 placeholder-zinc-500 transition-all focus:ring-0"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors"
                                        >
                                            <Mic className="w-4 h-4" />
                                        </button>
                                        <button
                                            disabled={asking || !question.trim()}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-full text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                                        >
                                            {asking ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                            {asking ? "Thinking..." : "Send"}
                                        </button>
                                    </div>
                                </form>
                                <div className="text-center mt-3">
                                    <p className="text-[10px] text-zinc-400">
                                        AI Advisor uses graph data to generate security insights.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="pill"
                        layoutId="ama-pill"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => setIsOpen(true)}
                        className="cursor-pointer group relative"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>

                        <div className="relative flex items-center gap-3 pl-2 pr-6 py-2 bg-white dark:bg-zinc-900 rounded-full ring-1 ring-gray-900/5 leading-none">
                            <div className="relative w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-indigo-500 to-purple-600">
                                <div className="w-full h-full rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-indigo-500" />
                                </div>
                            </div>
                            <span className="relative text-sm font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-widest">
                                Ask AI Advisor
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
