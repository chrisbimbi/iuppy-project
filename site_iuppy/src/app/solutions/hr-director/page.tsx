"use client";

import { FeatureRow } from "@/components/ui/feature-row";
import { Section } from "@/components/ui/section";
import { Quote } from "lucide-react";
import { NR1CrossSell } from "@/components/sections/NR1CrossSell";

export default function HRPage() {
    return (
        <>
            <Section className="bg-slate-50 pt-32 pb-24 border-b border-gray-200">
                <div className="container-custom max-w-5xl mx-auto text-center space-y-8">
                    <h1 className="text-5xl font-bold text-gray-900">
                        O fim do RH Operacional.
                    </h1>
                    <p className="text-2xl text-gray-500 max-w-3xl mx-auto">
                        Sua equipe gasta 40% do tempo respondendo dúvidas repetitivas. <br />
                        A Iuppy devolve esse tempo para você cuidar das pessoas.
                    </p>
                </div>
            </Section>

            <div className="container-custom py-12">
                <div className="bg-iuppy-blue rounded-3xl p-12 text-white relative overflow-hidden">
                    <Quote className="absolute top-8 left-8 text-white/20 w-32 h-32 rotate-180" />
                    <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
                        <img
                            src="/assets/hr_director.png"
                            className="w-48 h-48 rounded-full border-4 border-white/30 object-cover shadow-2xl"
                            alt="Diretora de RH"
                        />
                        <div className="space-y-6">
                            <p className="text-2xl font-light italic leading-relaxed">
                                "Antes eu era vista como o departamento que só cobrava burocracia. Hoje, com os dados da Iuppy, sento na mesa da diretoria para discutir estratégia de retenção."
                            </p>
                            <div>
                                <p className="font-bold text-lg">Mariana S.</p>
                                <p className="text-blue-200">Diretora de Gente & Gestão, Indústria Metalúrgica</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <FeatureRow
                title="Holerites e Ponto na palma da mão"
                description="Integramos com seu ERP (Totvs, SAP, ADP). O colaborador consulta o espelho de ponto e o holerite direto no app, sem bater na porta do RH."
                image={
                    <div className="h-64 bg-gray-100 flex items-center justify-center text-gray-400 font-bold">
                        [Integração ERP Visual]
                    </div>
                }
            />
            <NR1CrossSell variant="hr" />
        </>
    );
}
