"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Section } from "@/components/ui/section";

export function HeroSection() {
    return (
        <Section className="min-h-screen flex items-center justify-center pt-32 pb-20 relative overflow-hidden bg-gradient-to-br from-white via-blue-50 to-white">
            {/* Background Ambience */}
            <div className="absolute inset-0 z-0">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className="absolute top-0 right-0 w-[800px] h-[800px] bg-iuppy-blue/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1,
                    }}
                    className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-iuppy-orange/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"
                />
            </div>

            <div className="container-custom relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="space-y-8"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-iuppy-blue text-sm font-semibold">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        Nova Plataforma 2026
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-bold tracking-tighter text-gray-900 leading-[1.1]">
                        Se seu RH ainda imprime <span className="text-iuppy-blue">aviso de férias</span>, você está perdendo dinheiro.
                    </h1>

                    <p className="text-xl text-gray-600 max-w-lg leading-relaxed">
                        Chega de avisos que ninguém lê. Conheça a <strong>CI Ativa™</strong>: A única comunicação que vira execução.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button size="lg" className="shadow-xl shadow-blue-500/20">
                            Agendar Demonstração Gratuita
                        </Button>
                        <Button variant="outline" size="lg">
                            Ver na Prática
                        </Button>
                    </div>

                    <div className="pt-8 flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex -space-x-2">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white" />
                            ))}
                        </div>
                        <p>Junte-se a +200 líderes de RH inovadores</p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative"
                >
                    {/* Mockup Container */}
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-100 bg-white">
                        {/* Replace with actual video or hero image later */}
                        <img
                            src="/assets/worker.png"
                            alt="App Iuppy em uso na fábrica"
                            className="w-full h-auto object-cover"
                        />

                        {/* Floating Badge */}
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute bottom-8 left-8 bg-white p-4 rounded-xl shadow-lg border border-gray-100 max-w-[200px]"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">✓</div>
                                <span className="font-semibold text-sm">Férias Aprovadas</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full w-full bg-green-500 rounded-full"></div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </Section>
    );
}
