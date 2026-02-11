"use client";

import { Section } from "@/components/ui/section";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle, BarChart3, Smartphone, Users } from "lucide-react";
import { DashboardMockup } from "@/components/ui-mockups/DashboardMockup";

export function SolutionSection() {
    const features = [
        {
            icon: <BarChart3 className="w-6 h-6 text-iuppy-blue" />,
            title: "Previsão de Saída (AI)",
            desc: "Nossa IA avisa quem está infeliz antes do pedido de demissão.",
        },
        {
            icon: <Smartphone className="w-6 h-6 text-iuppy-orange" />,
            title: "Automação de Férias",
            desc: "Do app do colaborador direto para a folha. Sem papel. Sem erro.",
        },
        {
            icon: <Users className="w-6 h-6 text-green-600" />,
            title: "Integração Real",
            desc: "Conectado SAP, ADP, Totvs. Seus dados, sempre sincronizados.",
        },
    ];

    return (
        <Section className="bg-gradient-to-b from-gray-50 to-white py-32">
            <div className="container-custom">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <span className="text-iuppy-blue font-bold tracking-wider uppercase text-sm mb-4 block">
                            A Virada de Chave
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-sans">
                            A culpa não é sua. <br /> É da ferramenta.
                        </h2>
                        <p className="text-xl text-gray-600">
                            Conheça a <strong className="text-iuppy-blue">CI Ativa™</strong>.
                            Transforme a comunicação interna em um motor de eficiência operacional.
                        </p>
                    </motion.div>
                </div>

                <div className="grid lg:grid-cols-1 gap-16 items-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className=""
                    >
                        <DashboardMockup />
                    </motion.div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8 items-start">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.2 }}
                            className="flex flex-col gap-4 p-6 rounded-2xl bg-white shadow-lg shadow-gray-100 hover:shadow-xl transition-shadow border border-gray-50 h-full"
                        >
                            <div className="shrink-0 w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                                {feature.icon}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                            </div>
                        </motion.div>
                    ))}

                </div>

                <div className="pt-16 text-center">
                    <Link href="/platform">
                        <Button size="lg" className="px-10 h-14 text-lg">
                            Conhecer Todas as Funcionalidades
                        </Button>
                    </Link>
                </div>
            </div>
        </Section >
    );
}
