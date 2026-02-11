"use client";

import { Section } from "@/components/ui/section";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";

export function PersonaSection() {
    return (
        <Section className="bg-white py-24 border-y border-gray-100">
            <div className="container-custom grid lg:grid-cols-2 gap-20 items-center">
                <div className="relative">
                    <div className="absolute top-4 left-4 w-full h-full border-2 border-iuppy-blue/20 rounded-2xl translate-x-4 translate-y-4" />
                    <img
                        src="/assets/hr_director.png"
                        alt="Diretora de RH preocupada"
                        className="relative rounded-2xl shadow-2xl w-full object-cover aspect-[4/5]"
                    />
                </div>

                <div className="space-y-8">
                    <h2 className="text-4xl font-bold text-gray-900 leading-tight">
                        Você não estudou Gestão de Pessoas para <span className="text-iuppy-orange">colar papel na parede</span>.
                    </h2>

                    <div className="space-y-6 text-lg text-gray-600 leading-relaxed">
                        <p>
                            Sabemos da sua realidade. Você é cobrada por <strong>estratégia, cultura e retenção</strong>, mas passa o dia respondendo as mesmas perguntas no WhatsApp e imprimindo holerites.
                        </p>
                        <p>
                            Enquanto o Marketing tem ferramentas de ponta e Vendas tem CRMs milionários, o RH continua no improviso.
                        </p>
                        <p className="font-medium text-gray-900 border-l-4 border-iuppy-blue pl-4 py-1">
                            "A Iuppy foi a primeira vez que me senti valorizada como gestora. Parei de apagar incêndio e comecei a construir cultura."
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 pt-4">
                        <div>
                            <h4 className="text-3xl font-bold text-iuppy-blue">30%</h4>
                            <p className="text-sm text-gray-500">Menos tempo operacional</p>
                        </div>
                        <div>
                            <h4 className="text-3xl font-bold text-iuppy-blue">4x</h4>
                            <p className="text-sm text-gray-500">Mais engajamento</p>
                        </div>
                    </div>
                </div>
            </div>
        </Section>
    );
}
