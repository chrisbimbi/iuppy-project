"use client";

import { FeatureRow } from "@/components/ui/feature-row";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { HardHat, WifiOff, FileCheck2, Users, Factory, AlertTriangle, ScanFace } from "lucide-react";
import Link from "next/link";
import { PreFooterCTA } from "@/components/layout/PreFooterCTA";
import { NR1CrossSell } from "@/components/sections/NR1CrossSell";

export default function ManufacturingPage() {
    return (
        <>
            {/* HERO SECTION */}
            <Section className="bg-slate-900 text-white pt-40 pb-24 border-b border-white/10 relative overflow-hidden">
                {/* Background Overlay */}
                <div className="absolute inset-0 bg-[url('/assets/factory_worker.png')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>

                <div className="container-custom relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-12">
                        <div className="flex-1 space-y-8 text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-yellow-500/30 bg-yellow-900/20 text-yellow-500 text-sm font-bold tracking-wider mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <Factory className="w-4 h-4" />
                                <span>INDÚSTRIA 4.0 // PEOPLE</span>
                            </div>

                            <h1 className="text-5xl lg:text-7xl font-extrabold text-white leading-tight tracking-tight">
                                Conecte o time operacional <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">ao escritório central.</span>
                            </h1>

                            <p className="text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                                Quebre o abismo da comunicação entre o administrativo e a operação.
                                Digitalize avisos, segurança e holerites para quem não tem e-mail corporativo.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                                <Link href="/pricing">
                                    <Button size="lg" className="h-14 px-8 text-lg font-bold bg-yellow-500 text-slate-900 hover:bg-yellow-400 shadow-xl">
                                        Ver Solução para Indústria
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <div className="flex-1 relative">
                            <div className="relative z-10 animate-in fade-in slide-in-from-right duration-1000 delay-200">
                                <img
                                    src="/assets/headers/manufacturing.png"
                                    alt="Factory worker connected"
                                    className="w-full h-auto drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                            {/* Industrial Glow */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-orange-500/10 blur-[100px] -z-10 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </Section>

            {/* PAIN POINTS */}
            <div className="bg-white py-24">
                <div className="container-custom">
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                title: "Sem E-mail? Sem Problema.",
                                icon: Users,
                                desc: "Login simples via CPF ou Matrícula. Seu operador baixa o app e já está conectado, sem burocracia de TI."
                            },
                            {
                                title: "Adeus Mural de Papel",
                                icon: FileCheck2,
                                desc: "Mude avisos de turno, cardápio do refeitório e comunicados de CIPA em tempo real, sem gastar com impressão."
                            },
                            {
                                title: "Segurança em Primeiro Lugar",
                                icon: AlertTriangle,
                                desc: "Garanta que as Regras de Ouro e Diálogos de Segurança (DDS) foram lidos e compreendidos por 100% do time."
                            },
                        ].map((item, i) => (
                            <div key={i} className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:shadow-lg transition-all duration-300">
                                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm mb-6 border border-slate-100">
                                    <item.icon className="w-8 h-8 text-yellow-600" />
                                </div>
                                <h3 className="font-bold text-xl text-slate-900 mb-3">{item.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FEATURE DEEP DIVE: SECURE KIOSK */}
            <FeatureRow
                title="Celular proibido na linha? Use o Totem Iuppy."
                description="Não deixe a segurança operacional impedir a inclusão digital. Instale totens de autoatendimento no refeitório ou vestiário. O colaborador acessa em segundos e, se sair correndo para o turno, o sistema faz logout automático para proteger os dados."
                image={
                    <div className="bg-slate-900 h-96 rounded-xl flex items-center justify-center relative overflow-hidden shadow-2xl border border-slate-700 p-6">
                        {/* Totem Frame */}
                        <div className="w-48 h-full bg-slate-800 rounded-2xl border-[6px] border-slate-700 shadow-xl relative flex flex-col overflow-hidden">
                            {/* Camera/Sensor */}
                            <div className="h-4 bg-slate-700 w-full flex justify-center items-center">
                                <div className="w-2 h-2 rounded-full bg-black/50"></div>
                            </div>

                            {/* Screen Content */}
                            <div className="flex-1 bg-white p-3 relative">
                                <div className="flex justify-between items-center border-b pb-2 mb-2">
                                    <div className="flex gap-2 items-center">
                                        <div className="w-6 h-6 rounded-full bg-slate-200"></div>
                                        <div className="text-[8px] font-bold text-slate-700">Olá, Carlos</div>
                                    </div>
                                    <div className="text-[8px] font-bold text-iuppy-orange">Sair</div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <div className="bg-blue-50 p-2 rounded flex flex-col items-center gap-1">
                                        <div className="w-4 h-4 bg-blue-200 rounded"></div>
                                        <div className="text-[6px] font-bold">Holerite</div>
                                    </div>
                                    <div className="bg-orange-50 p-2 rounded flex flex-col items-center gap-1">
                                        <div className="w-4 h-4 bg-orange-200 rounded"></div>
                                        <div className="text-[6px] font-bold">Férias</div>
                                    </div>
                                </div>

                                <div className="bg-slate-100 p-2 rounded mb-2">
                                    <div className="text-[6px] font-bold mb-1">Avisos da Planta</div>
                                    <div className="w-full h-1 bg-slate-300 rounded mb-1"></div>
                                    <div className="w-2/3 h-1 bg-slate-300 rounded"></div>
                                </div>

                                {/* Security Overlay - The Impactful Part */}
                                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-[1px] flex items-center justify-center">
                                    <div className="bg-white p-3 rounded-lg shadow-2xl w-[90%] text-center animate-in zoom-in duration-300">
                                        <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin mx-auto mb-2"></div>
                                        <div className="text-[10px] font-bold text-slate-900 mb-1">Encerrando Sessão</div>
                                        <div className="text-[8px] text-slate-500 mb-2">Inatividade detectada</div>
                                        <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                                            <div className="bg-orange-500 w-1/4 h-full animate-[shrink_3s_linear_infinite]" style={{ width: '30%' }}></div>
                                        </div>
                                        <div className="text-[8px] font-bold text-orange-600 mt-1">Fechando em 3s...</div>
                                    </div>
                                </div>
                            </div>

                            {/* Home Button */}
                            <div className="h-8 bg-slate-800 flex justify-center items-center">
                                <div className="w-8 h-1 bg-slate-600 rounded-full"></div>
                            </div>
                        </div>


                    </div>
                }
                notes={[
                    "Login Rápido (Crachá ou QR Code)",
                    "Logout Automático por inatividade",
                    "Modo de Privacidade (Filtro de tela)"
                ]}
            />

            {/* FEATURE DEEP DIVE: CULTURAL FIT */}
            <FeatureRow
                reversed
                title="Dê voz ao Operador"
                description="O colaborador de linha de frente tem as melhores ideias de melhoria. Dê a ele um canal direto para sugestões e reconhecimento."
                image={
                    <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg flex flex-col gap-4">
                        <div className="flex gap-4 items-start pb-4 border-b border-gray-100">
                            <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                            <div>
                                <div className="text-sm font-bold text-slate-900">José Costa (Usinagem)</div>
                                <div className="text-xs text-slate-500">Há 2 horas • Ideia de Melhoria</div>
                                <p className="text-sm mt-2 text-slate-700">
                                    "Podíamos colocar um espelho convexo na saída do almoxarifado para evitar colisão com as empilhadeiras."
                                </p>
                            </div>
                        </div>

                        <div className="pl-14">
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                <div className="text-xs font-bold text-iuppy-blue mb-1">Resposta do Gerente da Planta</div>
                                <p className="text-xs text-slate-700">Excelente ideia, José! Já encaminhei para a Segurança do Trabalho avaliar. Obrigado!</p>
                            </div>
                        </div>
                    </div>
                }
                notes={[
                    "Canal de Ideias e Sugestões",
                    "Reconhecimento Social (Kudos/Elogios)",
                    "Ouvidoria Anônima Integrada"
                ]}
                gradient="from-slate-600 to-slate-800"
            />

            <NR1CrossSell variant="industry" />
            <PreFooterCTA />
        </>
    );
}
