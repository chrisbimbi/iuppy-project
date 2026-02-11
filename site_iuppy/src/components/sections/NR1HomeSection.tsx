"use client";

import { useState } from "react";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, FileCheck } from "lucide-react";
import { DemoModal } from "@/components/conversion/DemoModal";

export function NR1HomeSection() {
    const [isDemoOpen, setDemoOpen] = useState(false);

    return (
        <Section className="bg-slate-900 text-white py-24 relative overflow-hidden">
            <DemoModal isOpen={isDemoOpen} onClose={() => setDemoOpen(false)} />

            {/* Warning Tape Effect */}
            <div className="absolute top-0 left-0 w-full h-4 bg-yellow-400 transform -skew-x-12 opacity-80" />
            <div className="absolute bottom-0 right-0 w-full h-4 bg-yellow-400 transform -skew-x-12 opacity-80" />

            <div className="container-custom text-center max-w-4xl mx-auto space-y-8 relative z-10">
                <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full border border-yellow-500/50 font-bold uppercase tracking-wider text-sm">
                    <AlertTriangle className="w-5 h-5" />
                    Risco Criminal & Trabalhista
                </div>

                <h2 className="text-4xl md:text-5xl font-bold">
                    Seu passivo trabalhista está <br />
                    <span className="text-yellow-400">crescendo sem você ver?</span>
                </h2>

                <p className="text-xl text-slate-300 leading-relaxed">
                    A falta de evidências digitais de segurança pode custar o CPF da diretoria.
                    <br />
                    <strong className="text-white">Transforme a NR-1 em um cofre de provas conectado ao eSocial.</strong>
                </p>

                <div className="grid md:grid-cols-3 gap-6 text-left py-8">
                    <div className="bg-white/10 p-6 rounded-xl border border-white/5 backdrop-blur-sm hover:bg-white/15 transition-colors">
                        <FileCheck className="w-8 h-8 text-blue-400 mb-4" />
                        <h4 className="font-bold text-lg mb-2">Automação eSocial S-2240</h4>
                        <p className="text-sm text-slate-400">Geração e transmissão automática dos eventos de Fatores de Risco. Adeus, planilhas.</p>
                    </div>
                    <div className="bg-white/10 p-6 rounded-xl border border-white/5 backdrop-blur-sm hover:bg-white/15 transition-colors">
                        <Clock className="w-8 h-8 text-green-400 mb-4" />
                        <h4 className="font-bold text-lg mb-2">Evidência com SHA-256</h4>
                        <p className="text-sm text-slate-400">Cada "Li e Aceito" gera um hash imutável. Prova jurídica irrefutável de entrega de EPI e normas.</p>
                    </div>
                    <div className="bg-white/10 p-6 rounded-xl border border-white/5 backdrop-blur-sm hover:bg-white/15 transition-colors">
                        <AlertTriangle className="w-8 h-8 text-red-400 mb-4" />
                        <h4 className="font-bold text-lg mb-2">Proteção Contra Art. 13 CP</h4>
                        <p className="text-sm text-slate-400">Mitigue a responsabilidade criminal por omissão com rastreabilidade total de gestão.</p>
                    </div>
                </div>

                <Button onClick={() => setDemoOpen(true)} className="bg-yellow-500 text-slate-900 hover:bg-yellow-400 font-bold text-lg px-8 h-12 shadow-lg shadow-yellow-500/20">
                    Blindar Meu CPF Agora
                </Button>
            </div>
        </Section>
    );
}
