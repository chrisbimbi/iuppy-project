"use client";

import { FeatureRow } from "@/components/ui/feature-row";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Target, Users, Megaphone, Zap, BarChart, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { PreFooterCTA } from "@/components/layout/PreFooterCTA";
import { NR1CrossSell } from "@/components/sections/NR1CrossSell";

export default function LeadersPage() {
    return (
        <>
            {/* HERO SECTION */}
            <Section className="bg-slate-900 text-white pt-40 pb-24 border-b border-white/10 overflow-hidden">
                <div className="container-custom">
                    <div className="flex flex-col lg:flex-row items-center gap-12">
                        <div className="flex-1 space-y-8 text-center lg:text-left z-10">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-900/20 text-blue-400 text-sm font-bold tracking-wider mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <Target className="w-4 h-4" />
                                <span>EXECUTIVE ALIGNMENT</span>
                            </div>

                            <h1 className="text-5xl lg:text-7xl font-extrabold text-white leading-tight tracking-tight">
                                Lidere com clareza. <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Inspire com propósito.</span>
                            </h1>

                            <p className="text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                                A ferramenta que CEOs e Diretores usam para garantir que a estratégia saia do PowerPoint e chegue na mente de cada colaborador.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                                <Link href="/pricing">
                                    <Button size="lg" className="h-14 px-8 text-lg font-bold bg-white text-slate-900 hover:bg-slate-100 shadow-xl">
                                        Conhecer a Plataforma
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <div className="flex-1 relative">
                            <div className="relative z-10 animate-in fade-in slide-in-from-bottom duration-1000 delay-200">
                                <img
                                    src="/assets/headers/leaders.png"
                                    alt="CEO analyzing strategic alignment"
                                    className="w-full h-auto drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                            {/* Glow */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-600/20 blur-[100px] -z-10 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </Section>

            {/* STRATEGIC PILLARS */}
            <div className="bg-white py-24 border-b border-gray-100">
                <div className="container-custom">
                    <div className="grid md:grid-cols-3 gap-12">
                        {[
                            {
                                title: "Alinhamento Organizacional",
                                icon: Target,
                                desc: "Garanta que todos, do estagiário ao diretor, saibam para onde a empresa está indo e por quê."
                            },
                            {
                                title: "Comunicação de Crise",
                                icon: ShieldCheck,
                                desc: "Em momentos críticos, tenha um canal direto e instantâneo para cortar rumores e trazer a versão oficial."
                            },
                            {
                                title: "Visibilidade do Líder",
                                icon: Megaphone,
                                desc: "Humanize sua liderança com vídeos e mensagens diretas, sem filtros e sem a frieza do e-mail."
                            },
                        ].map((item, i) => (
                            <div key={i} className="group p-8 border border-gray-100 rounded-2xl hover:shadow-xl transition-all duration-300 bg-slate-50 hover:bg-white">
                                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm mb-6 border border-gray-100 group-hover:scale-110 transition-transform">
                                    <item.icon className="w-7 h-7 text-slate-900" />
                                </div>
                                <h3 className="font-bold text-2xl text-slate-900 mb-3">{item.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FEATURE DEEP DIVE: STRATEGIC COMMS */}
            <FeatureRow
                title="Sua voz, direto na ponta"
                description="Vídeos curtos do CEO têm 5x mais engajamento que e-mails de 'All Hands'. Use o aplicativo para compartilhar conquistas, reforçar valores e celebrar vitórias."
                image={
                    <div className="bg-slate-900 aspect-video rounded-xl relative overflow-hidden shadow-2xl flex items-center justify-center group cursor-pointer">
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors z-10"></div>
                        <img
                            src="/assets/hr_director.png" // Placeholder, should ideally be a CEO image or similar
                            className="absolute inset-0 w-full h-full object-cover opacity-80"
                            alt="CEO Video"
                        />
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center z-20 group-hover:scale-110 transition-transform border border-white/50">
                            <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[24px] border-l-white border-b-[12px] border-b-transparent ml-2"></div>
                        </div>
                        <div className="absolute bottom-6 left-6 z-20 text-white">
                            <div className="font-bold text-lg">Resultados Q3 e Novos Rumos</div>
                            <div className="text-sm opacity-80">Mensagem do CEO • 2 min</div>
                        </div>
                    </div>
                }
                notes={[
                    "Hospedagem de vídeo nativa (sem YouTube)",
                    "Notificação Push 'Urgente' para toda a empresa",
                    "Comentários moderados para feedback controlado"
                ]}
            />

            {/* FEATURE DEEP DIVE: PULSE */}
            <FeatureRow
                reversed
                title="Sinta o pulso da organização"
                description="Não espere a pesquisa de clima anual para saber que algo está errado. Tenha termômetros em tempo real sobre a receptividade das suas decisões."
                image={
                    <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
                        <h4 className="font-bold text-slate-900 mb-6 border-b pb-4">Painel Executivo</h4>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-medium text-slate-600">Adesão à Nova Estratégia</span>
                                    <span className="text-sm font-bold text-green-600">Alta (88%)</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div className="bg-green-500 h-2 rounded-full" style={{ width: "88%" }}></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-medium text-slate-600">Leitura do Anúncio de Fusão</span>
                                    <span className="text-sm font-bold text-blue-600">95% da Empresa</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: "95%" }}></div>
                                </div>
                            </div>

                            <div className="p-4 bg-orange-50 rounded-lg border border-orange-100 flex gap-3 items-start">
                                <Zap className="w-5 h-5 text-orange-500 mt-0.5" />
                                <div>
                                    <div className="text-sm font-bold text-slate-900">Insight de IA</div>
                                    <div className="text-xs text-slate-600 mt-1">
                                        O time de Vendas está 30% mais engajado com as notícias de produto do que no trimestre passado.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                }
                notes={[
                    "Feedback anônimo estruturado",
                    "Segmentação por unidade de negócio",
                    "Identificação de focos de resistência"
                ]}
                gradient="from-slate-700 to-slate-900"
            />

            {/* FEATURE DEEP DIVE: PERFORMANCE / TRAFFIC LIGHT */}
            <FeatureRow
                title="Quem está batendo a meta? (E quem precisa de ajuda?)"
                description="Acabe com a surpresa no final do trimestre. Tenha um semáforo de desempenho do seu time em tempo real. Identifique quem é Top Performer e quem precisa de um PDI urgente antes que custe caro."
                image={
                    <div className="bg-slate-50 h-80 rounded-xl p-6 flex flex-col shadow-xl border border-slate-200 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="font-bold text-slate-700">Acompanhamento de Metas Q1</h4>
                            <div className="flex gap-2 text-[10px] font-bold uppercase tracking-wider">
                                <span className="text-emerald-600 bg-emerald-100 px-2 py-1 rounded">OK</span>
                                <span className="text-amber-600 bg-amber-100 px-2 py-1 rounded">Atenção</span>
                                <span className="text-red-600 bg-red-100 px-2 py-1 rounded">Crítico</span>
                            </div>
                        </div>

                        <div className="space-y-3 relative z-10">
                            {/* Green Item */}
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg border-l-4 border-emerald-500 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">AB</div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-900">Ana Beatriz</div>
                                        <div className="text-xs text-slate-500">Meta: R$ 120k</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-emerald-600">105%</div>
                                    <div className="text-[10px] text-slate-400">Bônus Garantido</div>
                                </div>
                            </div>

                            {/* Yellow Item */}
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg border-l-4 border-amber-500 shadow-sm opacity-90">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">CS</div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-900">Carlos Silva</div>
                                        <div className="text-xs text-slate-500">Meta: R$ 120k</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-amber-600">82%</div>
                                    <div className="text-[10px] text-slate-400">Criar Plano de Ação</div>
                                </div>
                            </div>

                            {/* Red Item */}
                            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border-l-4 border-red-500 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">JM</div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-900">João Mendes</div>
                                        <div className="text-xs text-slate-500">Meta: R$ 120k</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-red-600">45%</div>
                                    <div className="text-[10px] text-red-400 font-bold">Prejuízo Potencial</div>
                                </div>
                            </div>
                        </div>
                    </div>
                }
                notes={[
                    "PDI (Plano de Desenvolvimento) Integrado",
                    "Alertas automáticos de desvio de meta",
                    "Feedback contínuo (não espere dezembro)"
                ]}
                gradient="from-slate-100 to-slate-200"
            />

            <NR1CrossSell variant="leaders" />
            <PreFooterCTA />
        </>
    );
}
