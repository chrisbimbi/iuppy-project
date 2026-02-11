"use client";

import { Section } from "@/components/ui/section";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export function VillainSection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"],
    });

    const y = useTransform(scrollYProgress, [0, 1], [100, -100]);

    return (
        <Section className="bg-iuppy-villain text-white relative overflow-hidden py-32" ref={containerRef}>
            <div className="container-custom grid lg:grid-cols-2 gap-16 items-center">

                <motion.div
                    className="order-2 lg:order-1 relative"
                    style={{ y }}
                >
                    <img
                        src="/assets/villain.png"
                        alt="Caos na gestão de RH"
                        className="w-full max-w-md mx-auto drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                    />
                </motion.div>

                <div className="order-1 lg:order-2 space-y-8">
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-sm font-bold tracking-widest text-red-400 uppercase mb-4">
                            O Inimigo Invisível
                        </h2>
                        <h3 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                            Gestão Manual <br /> Fragmentada™
                        </h3>
                        <p className="text-lg text-blue-100 leading-relaxed mb-6">
                            Você não está cansado. Você está <strong className="text-white">sabotado</strong>.
                        </p>
                        <ul className="space-y-6">
                            {[
                                { icon: "📧", text: "E-mails que ninguém abre nem responde." },
                                { icon: "📅", text: "Planilhas de férias desatualizadas." },
                                { icon: "📱", text: "Grupos de WhatsApp tóxicos e sem controle." },
                            ].map((item, idx) => (
                                <motion.li
                                    key={idx}
                                    initial={{ opacity: 0, x: 20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.2 * idx, duration: 0.5 }}
                                    className="flex items-center gap-4 text-xl font-medium text-blue-50 bg-white/5 p-4 rounded-xl border border-white/10"
                                >
                                    <span className="text-2xl">{item.icon}</span>
                                    {item.text}
                                </motion.li>
                            ))}
                        </ul>
                        <p className="text-lg text-red-200 mt-8 italic border-l-4 border-red-500 pl-4">
                            "Isso não é comunicação. É ruído. E custa caro."
                        </p>
                    </motion.div>
                </div>
            </div>
        </Section>
    );
}
