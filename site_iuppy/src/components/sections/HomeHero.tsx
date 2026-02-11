"use client";

import { Button } from "@/components/ui/button";
import { AppMockup } from "@/components/ui-mockups/AppMockup";
import { DashboardMockup } from "@/components/ui-mockups/DashboardMockup";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

import Link from "next/link";
import { useState } from "react";
import { DemoModal } from "@/components/conversion/DemoModal";

export function HomeHero() {
    const [isDemoOpen, setDemoOpen] = useState(false);

    return (
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-slate-50">
            <DemoModal isOpen={isDemoOpen} onClose={() => setDemoOpen(false)} />

            <div className="container-custom relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <div className="space-y-6 text-center lg:text-left z-20">
                        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
                            Comunicação Inteligente. <br />
                            <span className="text-iuppy-orange">Onde a informação vira ação.</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                            A única plataforma de Comunicação Interna que conecta, executa e mede o engajamento real do seu time.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">

                            <Button onClick={() => setDemoOpen(true)} size="lg" className="h-14 px-8 text-lg font-bold bg-iuppy-orange hover:bg-orange-600 shadow-xl shadow-orange-500/20">
                                Começar Gratuitamente
                                <ArrowRight className="ml-2" />
                            </Button>

                            {/* 
                            <Link href="/solutions/nr1">
                                <Button variant="outline" size="lg" className="h-14 px-8 text-lg font-bold">
                                    Ver Demonstração
                                </Button>
                            </Link>
                             */}
                        </div>

                    </div>

                    {/* Right Mixed Reality Visual */}
                    <div className="relative h-[500px] lg:h-[600px] w-full flex items-center justify-center perspective-[2000px] pointer-events-none scale-75 lg:scale-90 origin-right">

                        {/* 1. Dashboard Mockup (Background) */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, rotateY: 10 }}
                            animate={{ opacity: 1, scale: 1, rotateY: -5 }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className="absolute z-10 w-[140%] -right-[20%] top-10 shadow-2xl rounded-xl"
                        >
                            <div className="relative rounded-xl overflow-hidden shadow-2xl border border-gray-200 bg-white">
                                <DashboardMockup />
                                {/* Overlay gradient to fade it slightly into background */}
                                <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent pointer-events-none" />
                            </div>
                        </motion.div>

                        {/* 2. App Mockup (Left - Secondary) - NR1 Variant */}
                        <motion.div
                            initial={{ opacity: 0, y: 50, x: -20 }}
                            animate={{ opacity: 1, y: 0, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.5 }}
                            className="absolute left-0 bottom-10 z-20 transform -rotate-6 shadow-2xl rounded-[40px]"
                        >
                            <AppMockup variant="nr1" className="!h-[550px] !w-[275px]" />
                        </motion.div>

                        {/* 3. App Mockup (Right - Primary with Notification) */}
                        <motion.div
                            initial={{ opacity: 0, y: 100, x: 20 }}
                            animate={{ opacity: 1, y: 0, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.7 }}
                            className="absolute right-10 -bottom-5 z-30 shadow-2xl rounded-[40px]"
                        >
                            <AppMockup showNotification={true} className="!h-[600px] !w-[300px]" />
                        </motion.div>

                        {/* Floating Element 1 - Engagement (Keep existing but reposition) */}
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 1.2, type: "spring" }}
                            className="absolute top-20 left-10 z-40 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 animate-bounce-slow"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-xl">🚀</div>
                                <div>
                                    <div className="font-bold text-slate-900 text-sm">Engajamento Recorde!</div>
                                    <div className="text-slate-500 text-xs">98% de leitura na fábrica</div>
                                </div>
                            </div>
                        </motion.div>

                    </div>
                </div>
            </div>
        </section>
    );
}
