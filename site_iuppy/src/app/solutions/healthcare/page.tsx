"use client";

import { FeatureRow } from "@/components/ui/feature-row";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Stethoscope, FileText, UserCheck, HeartPulse, Shield, GraduationCap } from "lucide-react";
import Link from "next/link";
import { PreFooterCTA } from "@/components/layout/PreFooterCTA";
import { NR1CrossSell } from "@/components/sections/NR1CrossSell";

export default function HealthcarePage() {
    return (
        <>
            {/* HERO SECTION */}
            <Section className="bg-slate-50 pt-40 pb-24 border-b border-gray-200 overflow-hidden">
                <div className="container-custom">
                    <div className="flex flex-col lg:flex-row items-center gap-12">
                        <div className="flex-1 space-y-8 text-center lg:text-left z-10">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-teal-500/30 bg-teal-50 text-teal-600 text-sm font-bold tracking-wider mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <HeartPulse className="w-4 h-4" />
                                <span>SAÚDE & HOSPITAIS</span>
                            </div>

                            <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 leading-tight tracking-tight">
                                Cuidando de quem <br />
                                <span className="text-teal-500">cuida de vidas.</span>
                            </h1>

                            <p className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                                Enfermeiros e médicos não ficam sentados na frente de um computador.
                                Leve protocolos, escalas e comunicações vitais para o celular de quem está no plantão.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                                <Link href="/pricing">
                                    <Button size="lg" className="h-14 px-8 text-lg font-bold bg-teal-500 hover:bg-teal-600 text-white shadow-xl shadow-teal-500/20">
                                        Ver Solução para Hospitais
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <div className="flex-1 relative">
                            <div className="relative z-10 animate-in fade-in zoom-in duration-1000 delay-200">
                                <img
                                    src="/assets/headers/healthcare.png"
                                    alt="Doctor using mobile app"
                                    className="w-full h-auto drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                            {/* Sterile Glow */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-teal-100/60 blur-[100px] -z-10 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </Section>

            {/* PAIN POINTS */}
            <div className="bg-white py-24">
                <div className="container-custom">
                    <div className="grid md:grid-cols-3 gap-12">
                        {[
                            {
                                title: "Protocolos Atualizados",
                                icon: FileText,
                                desc: "Houve mudança no protocolo de triagem? Notifique toda a equipe clínica instantaneamente com recibo de leitura obrigatório."
                            },
                            {
                                title: "Educação Continuada",
                                icon: GraduationCap,
                                desc: "Garanta que a equipe domine novos protocolos. Treinamentos rápidos em vídeo com quiz de validação direto no app."
                            },
                            {
                                title: "Credenciamento & Compliance",
                                icon: Shield,
                                desc: "Mantenha documentos e certificações da equipe sempre em dia, com alertas automáticos de vencimento."
                            },
                        ].map((item, i) => (
                            <div key={i} className="text-center group">
                                <div className="w-16 h-16 mx-auto bg-teal-50 rounded-full flex items-center justify-center shadow-sm mb-6 group-hover:bg-teal-100 transition-colors">
                                    <item.icon className="w-8 h-8 text-teal-600" />
                                </div>
                                <h3 className="font-bold text-xl text-slate-900 mb-3">{item.title}</h3>
                                <p className="text-slate-600 leading-relaxed max-w-xs mx-auto">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FEATURE DEEP DIVE: URGENT COMMS */}
            <FeatureRow
                title="Comunicação Crítica em Tempo Real"
                description="Em um hospital, informação é vida. Use Push Notifications segmentados para avisar a UTI sobre novos procedimentos ou alertar a Manutenção sobre leitos."
                image={
                    <div className="bg-white border border-gray-200 h-80 rounded-xl p-8 flex items-center justify-center relative overflow-hidden shadow-lg">
                        {/* Abstract Phone Screen */}
                        <div className="w-64 bg-slate-100 rounded-xl h-full p-4 relative">
                            <div className="absolute top-8 left-4 right-4 bg-red-50 border border-red-100 p-4 rounded-lg shadow-sm z-10">
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                                        <Shield className="w-4 h-4 text-red-600" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-red-600 uppercase mb-1">Pop-up Obrigatório</div>
                                        <div className="font-bold text-slate-900 text-sm">Novo Protocolo: Sepse</div>
                                        <div className="text-xs text-slate-500 mt-1">Atualização imediata. Clique para ler.</div>
                                    </div>
                                </div>
                                <div className="mt-3 w-full bg-red-600 text-white text-xs font-bold py-2 rounded text-center">
                                    Ler e Confirmar Ciência
                                </div>
                            </div>
                            <div className="space-y-3 pt-32 opacity-30">
                                <div className="h-20 bg-white rounded-lg"></div>
                                <div className="h-20 bg-white rounded-lg"></div>
                            </div>
                        </div>
                    </div>
                }
                notes={[
                    "Recibo de Leitura com Validade Legal",
                    "Segmentação por Ala ou Especialidade",
                    "Histórico Auditável para Acreditação (ONA/JCI)"
                ]}
                gradient="from-teal-400 to-emerald-500"
            />

            {/* FEATURE DEEP DIVE: WELLNESS */}
            <FeatureRow
                reversed
                title="Cuidando do Cuidador"
                description="Reduza o Burnout. Ofereça canais de apoio psicológico, benefícios e reconhecimento para quem enfrenta rotinas exaustivas."
                image={
                    <div className="bg-gradient-to-br from-teal-50 to-blue-50 h-80 rounded-xl p-8 flex items-center justify-center">
                        <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full">
                            <div className="flex items-center gap-4 mb-4">
                                <Stethoscope className="w-10 h-10 text-teal-500 bg-teal-50 p-2 rounded-full" />
                                <div>
                                    <h4 className="font-bold text-slate-900">Portal de Bem-estar</h4>
                                    <p className="text-xs text-slate-500">Exclusivo para Colaboradores</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="p-3 border border-gray-100 rounded-lg flex gap-3 hover:bg-gray-50 cursor-pointer">
                                    <HeartPulse className="w-5 h-5 text-red-400" />
                                    <span className="text-sm font-medium text-slate-700">Apoio Psicológico 24h</span>
                                </div>
                                <div className="p-3 border border-gray-100 rounded-lg flex gap-3 hover:bg-gray-50 cursor-pointer">
                                    <UserCheck className="w-5 h-5 text-blue-400" />
                                    <span className="text-sm font-medium text-slate-700">Gympass / TotalPass</span>
                                </div>
                            </div>
                        </div>
                    </div>
                }
                notes={[
                    "Programa de Reconhecimento entre Pares",
                    "Acesso fácil a benefícios de saúde",
                    "Enquetes de pulso sobre carga de trabalho"
                ]}
                gradient="from-blue-400 to-teal-400"
            />

            <NR1CrossSell variant="healthcare" />
            <PreFooterCTA />
        </>
    );
}
