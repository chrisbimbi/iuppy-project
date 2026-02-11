"use client";

import { FeatureRow } from "@/components/ui/feature-row";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users, BarChart3, Wifi, Smartphone, Radio } from "lucide-react";
import Link from "next/link";
import { PreFooterCTA } from "@/components/layout/PreFooterCTA";
import { NR1CrossSell } from "@/components/sections/NR1CrossSell";

export default function CommsPage() {
    return (
        <>
            {/* HERO SECTION */}
            <Section className="bg-iuppy-blue text-white pt-40 pb-24 border-b border-white/10 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "40px 40px" }}></div>

                <div className="container-custom relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-12">
                        <div className="flex-1 space-y-8 text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/30 bg-white/10 text-white text-sm font-bold tracking-wider mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <Radio className="w-4 h-4" />
                                <span>COMUNICAÇÃO INTERNA 3.0</span>
                            </div>

                            <h1 className="text-5xl lg:text-7xl font-extrabold text-white leading-tight tracking-tight">
                                Amplifique sua voz. <br />
                                <span className="text-green-300">Engaje sua cultura.</span>
                            </h1>

                            <p className="text-xl text-blue-100 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                                Transforme a intranet passiva em uma comunidade ativa.
                                Sintonize todos os colaboradores na mesma frequência, onde quer que eles estejam.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                                <Link href="/pricing">
                                    <Button size="lg" className="h-14 px-8 text-lg font-bold bg-white text-iuppy-blue hover:bg-blue-50 shadow-xl">
                                        Modernizar minha CI
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <div className="flex-1 relative">
                            <div className="relative z-10 animate-in fade-in zoom-in duration-1000 delay-200">
                                <img
                                    src="/assets/headers/comms.png"
                                    alt="Diverse connected workforce"
                                    className="w-full h-auto drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                            {/* Energetic Glow */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-cyan-400/20 blur-[100px] -z-10 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </Section>

            {/* PAIN POINTS */}
            <div className="bg-white py-24">
                <div className="container-custom">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">
                            O custo invisível do "Não fiquei sabendo"
                        </h2>
                        <p className="text-slate-600 text-lg">
                            Desalinhamento gera retrabalho e desperdício. Pare de perder dinheiro com e-mails ignorados e garanta que a estratégia da empresa chegue na ponta.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                title: "Alcance Total",
                                icon: Smartphone,
                                desc: "Chegue no bolso de quem está na rua, na fábrica ou em home office. Notificações Push garantem a leitura."
                            },
                            {
                                title: "Multicanal Integrado",
                                icon: Wifi,
                                desc: "Publique uma vez, distribua para App, E-mail, TV Corporativa e Microsoft Teams automaticamente."
                            },
                            {
                                title: "Feedback Real",
                                icon: MessageSquare,
                                desc: "Abra espaço para comentários e reações. Entenda o sentimento da empresa antes que vire um problema."
                            },
                        ].map((item, i) => (
                            <div key={i} className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:shadow-lg transition-all duration-300">
                                <div className="w-14 h-14 bg-iuppy-blue rounded-xl flex items-center justify-center shadow-md mb-6 text-white">
                                    <item.icon className="w-7 h-7" />
                                </div>
                                <h3 className="font-bold text-xl text-slate-900 mb-3">{item.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FEATURE DEEP DIVE: SEGMENTATION */}
            <FeatureRow
                title="Chega de SPAM Corporativo"
                description="Seu time de vendas não precisa saber sobre a manutenção do ar condicionado da matriz. Segmente comunicados por cargo, unidade ou departamento e aumente a relevância."
                image={
                    <div className="bg-slate-100 h-80 rounded-xl p-8 flex items-center justify-center relative overflow-hidden shadow-inner font-sans">
                        <div className="w-full max-w-sm bg-white rounded-lg shadow-xl overflow-hidden border border-slate-200">
                            <div className="bg-gray-50 p-3 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase flex justify-between">
                                <span>Nova Publicação</span>
                                <span>Passo 2 de 3</span>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-900 block mb-2">Quem deve ver isso?</label>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center">
                                            Todos da Matriz <button className="ml-2 hover:text-blue-900">×</button>
                                        </span>
                                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center">
                                            Gerentes (Global) <button className="ml-2 hover:text-green-900">×</button>
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-900 block mb-2">Excluir público:</label>
                                    <span className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit border border-red-100">
                                        Estagiários <button className="ml-2 hover:text-red-900">×</button>
                                    </span>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-3 text-right">
                                <Button size="sm" className="bg-iuppy-blue">Agendar Envio</Button>
                            </div>
                        </div>
                    </div>
                }
                notes={[
                    "Targeting via Grupos Dinâmicos",
                    "Agendamento de Publicação",
                    "Aprovação de Conteúdo (Workflow)"
                ]}
            />

            {/* FEATURE DEEP DIVE: ANALYTICS */}
            <FeatureRow
                reversed
                title="Métricas de Verdade"
                description="Visualizações não pagam contas. Meça o engajamento real, identifique embaixadores da marca e saiba quais pautas 'floparam' e quais viralizaram."
                image={
                    <div className="bg-slate-900 border border-slate-800 h-80 rounded-xl p-8 shadow-2xl relative overflow-hidden flex items-center justify-center">
                        <div className="w-full max-w-sm space-y-4">
                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <div className="text-slate-400 text-xs">Comunicado: "Resultados 2024"</div>
                                    <div className="text-white font-bold text-2xl">98.5% Lidos</div>
                                </div>
                                <div className="text-green-400 text-xs font-bold bg-green-400/10 px-2 py-1 rounded">+12% vs média</div>
                            </div>

                            <div className="w-full h-32 flex items-end gap-1">
                                {[40, 65, 45, 80, 55, 90, 70, 85, 95, 60, 75, 50].map((h, i) => (
                                    <div key={i} className="flex-1 bg-iuppy-blue/20 hover:bg-iuppy-blue transition-colors rounded-t" style={{ height: `${h}%` }}></div>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 rounded p-3">
                                    <div className="text-slate-400 text-xs">Tempo médio</div>
                                    <div className="text-white font-bold">4m 12s</div>
                                </div>
                                <div className="bg-white/5 rounded p-3">
                                    <div className="text-slate-400 text-xs">Compartilhamentos</div>
                                    <div className="text-white font-bold">245</div>
                                </div>
                            </div>
                        </div>
                    </div>
                }
                notes={[
                    "Heatmap de horários nobres",
                    "Ranking de conteudistas mais lidos",
                    "Exportação para PDF/Excel"
                ]}
            />

            <NR1CrossSell variant="comms" />
            <PreFooterCTA />
        </>
    );
}
