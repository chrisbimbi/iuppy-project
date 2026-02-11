"use client";

import { motion } from "framer-motion";
import { Bell, Menu, Home, MessageSquare, User, ThumbsUp, Heart, Share2, MoreHorizontal, CheckCircle2, AlertCircle, FileText, Search, Trophy, ShieldAlert, ArrowLeft, PenTool } from "lucide-react";

interface AppMockupProps {
    className?: string;
    showNotification?: boolean;
    variant?: "feed" | "nr1";
}

export function AppMockup({ className, showNotification = false, variant = "feed" }: AppMockupProps) {
    return (
        <div className={`relative w-[300px] h-[600px] bg-white rounded-[40px] border-[8px] border-gray-900 shadow-2xl overflow-hidden mx-auto font-sans ${className}`}>
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-6 bg-gray-900 rounded-b-2xl z-20" />

            {/* Status Bar */}
            <div className="h-12 bg-white flex items-end justify-between px-6 pb-2 text-xs font-bold text-gray-900">
                <span>9:41</span>
                <div className="flex gap-1">
                    <div className="w-4 h-3 bg-gray-900 rounded-sm" />
                    <div className="w-4 h-3 bg-gray-900/30 rounded-sm" />
                </div>
            </div>

            {/* Push Notification Overlay */}
            {showNotification && (
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1, type: "spring" }}
                    className="absolute top-14 left-4 right-4 z-50 pointer-events-none"
                >
                    <div className="bg-white/95 backdrop-blur-md shadow-lg rounded-2xl p-3 border border-gray-200/50 flex gap-3">
                        <div className="w-10 h-10 rounded-xl bg-iuppy-blue flex items-center justify-center shrink-0 shadow-sm">
                            <span className="text-white font-bold text-lg">i</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <h5 className="font-bold text-gray-900 text-xs text-sm">iuppy</h5>
                                <span className="text-[10px] text-gray-500">Agora</span>
                            </div>
                            <p className="text-xs text-gray-700 font-medium leading-tight mt-0.5">
                                📣 <span className="font-bold">Holerite Disponível!</span> O seu demonstrativo de pagamento de Abril já está no app.
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* === VARIANT: FEED (Standard) === */}
            {variant === "feed" && (
                <>
                    {/* App Header */}
                    <div className="px-4 py-3 pb-4 flex items-center justify-between bg-white sticky top-12 z-10 shadow-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-iuppy-blue flex items-center justify-center text-white font-bold text-sm">i</div>
                            <span className="text-lg font-extrabold text-gray-900 tracking-tight">iuppy</span>
                        </div>
                        <div className="w-9 h-9 bg-gray-50 rounded-full flex items-center justify-center relative">
                            <Bell className="w-5 h-5 text-gray-600" />
                            <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />
                        </div>
                    </div>

                    {/* App Content (Feed) */}
                    <div className="h-full overflow-y-auto bg-[#f0f2f5] pb-24 no-scrollbar">

                        {/* Stories / Highlights */}
                        <div className="pt-4 pb-2 pl-4 overflow-x-auto no-scrollbar flex gap-3">
                            {[
                                { name: "Destaques", color: "from-pink-500 to-orange-500", img: "bg-gray-100" },
                                { name: "Eventos", color: "from-blue-500 to-purple-500", img: "bg-blue-50" },
                                { name: "RH", color: "from-green-500 to-teal-500", img: "bg-green-50" },
                            ].map((story, i) => (
                                <div key={i} className="flex flex-col items-center gap-1 shrink-0">
                                    <div className={`w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr ${story.color}`}>
                                        <div className="w-full h-full bg-white rounded-full p-[2px]">
                                            <div className={`w-full h-full rounded-full ${story.img}`} />
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-medium text-gray-600">{story.name}</span>
                                </div>
                            ))}
                        </div>

                        {/* Feed Cards */}
                        <div className="px-0 space-y-3 mt-2">

                            {/* Card 1: Important Announcement */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 }}
                                className="bg-white p-4 pb-2"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center border border-red-50">
                                            <AlertCircle className="w-5 h-5 text-red-600" />
                                        </div>
                                        <div className="leading-tight">
                                            <h4 className="font-bold text-sm text-gray-900">Comunicado Oficial</h4>
                                            <p className="text-[10px] text-gray-500 font-medium">Equipe de RH • 2h atrás</p>
                                        </div>
                                    </div>
                                    <MoreHorizontal className="w-5 h-5 text-gray-400" />
                                </div>

                                <p className="text-sm text-gray-800 leading-relaxed mb-3">
                                    <span className="font-bold">Atenção time!</span> As novas diretrizes de segurança (NR-1) já estão disponíveis. É obrigatória a leitura e assinatura digital até sexta-feira.
                                </p>

                                <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-center gap-3 mb-3">
                                    <div className="bg-white p-2 rounded-md shadow-sm">
                                        <FileText className="w-5 h-5 text-red-500" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-xs text-red-900">Norma Regulamentadora 01.pdf</div>
                                        <div className="text-[10px] text-red-400">2.4 MB • PDF</div>
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                                    <div className="flex items-center gap-1 text-gray-500 text-xs">
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        <span>245 assinaturas</span>
                                    </div>
                                    <button className="bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-sm hover:bg-blue-700">
                                        Assinar Agora
                                    </button>
                                </div>
                            </motion.div>

                            {/* Card 2: Social Post */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.4 }}
                                className="bg-white p-4 pb-2"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center border border-blue-50">
                                            <span className="font-bold text-blue-600">i</span>
                                        </div>
                                        <div className="leading-tight">
                                            <h4 className="font-bold text-sm text-gray-900">Cultura Iuppy</h4>
                                            <p className="text-[10px] text-gray-500 font-medium">Equipe de MKT • 5h atrás</p>
                                        </div>
                                    </div>
                                    <MoreHorizontal className="w-5 h-5 text-gray-400" />
                                </div>

                                <p className="text-sm text-gray-800 leading-relaxed mb-3">
                                    Hoje completamos 1 ano do nosso novo escritório! 🎂 Quem estava aqui desde o começo? Comentem suas melhores memórias! 👇
                                </p>

                                <div className="h-40 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl mb-3 flex items-center justify-center text-white font-bold shadow-inner">
                                    Foto do Escritório 📸
                                </div>

                                <div className="border-t border-gray-100 pt-2 flex items-center justify-between">
                                    <button className="flex items-center gap-1.5 text-gray-500 hover:text-red-500 transition-colors py-1">
                                        <Heart className="w-5 h-5" />
                                        <span className="text-xs font-bold">142</span>
                                    </button>
                                    <button className="flex items-center gap-1.5 text-gray-500 hover:text-blue-500 transition-colors py-1">
                                        <MessageSquare className="w-5 h-5" />
                                        <span className="text-xs font-bold">58</span>
                                    </button>
                                    <button className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors py-1">
                                        <Share2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>

                        </div>
                    </div>
                </>
            )}

            {/* === VARIANT: NR1 (Compliance) === */}
            {variant === "nr1" && (
                <>
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-4 bg-white sticky top-0 z-10">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                        <h3 className="font-bold text-gray-900">Meus Documentos</h3>
                    </div>

                    <div className="h-full overflow-y-auto bg-white p-6 pb-24">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                                <ShieldAlert className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 leading-none">NR-01</h2>
                                <p className="text-sm text-gray-500">Ordens de Serviço</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <h5 className="font-bold text-gray-800 text-sm mb-2">Riscos Identificados</h5>
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-bold">Ruído</span>
                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-bold">Ergonômico</span>
                                </div>
                            </div>

                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <h5 className="font-bold text-blue-800 text-sm mb-2">EPIs Obrigatórios</h5>
                                <ul className="text-xs text-blue-700 space-y-1 ml-4 list-disc">
                                    <li>Protetor Auricular</li>
                                    <li>Calçado de Segurança</li>
                                </ul>
                            </div>

                            <div className="text-xs text-justify text-gray-500 leading-relaxed">
                                Declaro que recebi treinamento sobre o uso correto dos equipamentos de proteção e estou ciente dos riscos inerentes à minha função...
                            </div>

                            <div className="pt-4">
                                <button className="w-full h-12 bg-iuppy-blue text-white font-bold rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 hover:bg-iuppy-blue/90 transition-colors">
                                    <PenTool className="w-4 h-4" />
                                    Assinar Digitalmente
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Bottom Nav */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-white border-t border-gray-100 flex items-start justify-around px-4 pt-4 z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.02)]">
                <div className={`flex flex-col items-center gap-1 ${variant === "feed" ? "text-iuppy-blue" : "text-gray-300"}`}>
                    <Home className={`w-6 h-6 ${variant === "feed" ? "fill-current" : ""}`} />
                </div>
                <div className="flex flex-col items-center gap-1 text-gray-300">
                    <Search className="w-6 h-6" />
                </div>
                <div className="flex flex-col items-center gap-1 text-gray-300">
                    <div className="w-10 h-10 bg-iuppy-orange rounded-full flex items-center justify-center -mt-8 shadow-lg shadow-orange-200 border-4 border-white">
                        <MessageSquare className="w-5 h-5 text-white fill-current" />
                    </div>
                </div>
                <div className={`flex flex-col items-center gap-1 ${variant === "nr1" ? "text-iuppy-blue" : "text-gray-300"}`}>
                    <FileText className={`w-6 h-6 ${variant === "nr1" ? "fill-current" : ""}`} />
                </div>
                <div className="flex flex-col items-center gap-1 text-gray-300">
                    <User className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
}
