"use client";

import { useState } from "react";
import { FeatureRow } from "@/components/ui/feature-row";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Heart, TrendingUp, Users, BarChart3, Star, Target, Coffee } from "lucide-react";
import Link from "next/link";
import { PreFooterCTA } from "@/components/layout/PreFooterCTA";
import { NR1CrossSell } from "@/components/sections/NR1CrossSell";
import { DemoModal } from "@/components/conversion/DemoModal";

export default function HRPage() {
    const [isDemoOpen, setDemoOpen] = useState(false);

    return (
        <>
            <DemoModal isOpen={isDemoOpen} onClose={() => setDemoOpen(false)} />
            {/* HERO SECTION */}
            <Section className="bg-slate-50 pt-40 pb-24 border-b border-gray-200 overflow-hidden">
                <div className="container-custom">
                    <div className="flex flex-col lg:flex-row items-center gap-12">
                        <div className="flex-1 space-y-8 text-center lg:text-left z-10">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-iuppy-orange/30 bg-iuppy-orange/10 text-iuppy-orange text-sm font-bold tracking-wider mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <Heart className="w-4 h-4 fill-current" />
                                <span>EMPLOYEE EXPERIENCE FIRST</span>
                            </div>

                            <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 leading-tight tracking-tight">
                                Transforme o RH Operacional <br />
                                <span className="text-iuppy-blue">em RH Estratégico.</span>
                            </h1>

                            <p className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                                Chega de colar papel na parede. Conecte 100% dos seus colaboradores, automatize processos manuais e meça o impacto real da sua cultura organizacional.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                                <Link href="/pricing">
                                    <Button size="lg" className="h-14 px-8 text-lg font-bold bg-iuppy-blue hover:bg-blue-600 shadow-xl shadow-blue-500/20">
                                        Ver Planos e Preços
                                    </Button>
                                </Link>
                                <Button
                                    onClick={() => setDemoOpen(true)}
                                    variant="outline"
                                    size="lg"
                                    className="h-14 px-8 text-lg font-bold hover:bg-white bg-transparent"
                                >
                                    Agendar Demonstração
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 relative">
                            <div className="relative z-10 animate-in fade-in slide-in-from-right duration-1000 delay-200">
                                <img
                                    src="/assets/headers/hr.png"
                                    alt="HR Manager with engagement metrics"
                                    className="w-full h-auto drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                            {/* Abstract background shapes */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-orange-200/40 to-pink-200/40 blur-[80px] -z-10 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </Section>

            {/* PAIN POINTS GRID */}
            <div className="bg-white py-24">
                <div className="container-custom">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">
                            Você não estudou Gestão de Pessoas para gerenciar planilhas
                        </h2>
                        <p className="text-slate-600 text-lg">
                            Liberte seu time das tarefas repetitivas e foque no que realmente importa: as pessoas.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12">
                        {[
                            {
                                title: "Alcance Inimaginável",
                                icon: Target,
                                color: "text-red-500",
                                desc: "Como engajar quem não tem e-mail corporativo? Nosso app chega no bolso de todos, do escritório à fábrica."
                            },
                            {
                                title: "Cultura Mensurável",
                                icon: BarChart3,
                                color: "text-blue-500",
                                desc: "Pare de adivinhar. Tenha dados reais de quem leu os comunicados e como está o clima em cada departamento."
                            },
                            {
                                title: "Pertencimento Real",
                                icon: Users,
                                color: "text-green-500",
                                desc: "Crie uma comunidade digital onde as pessoas se sentem ouvidas, reconhecidas e parte de algo maior."
                            },
                        ].map((item, i) => (
                            <div key={i} className="text-center space-y-4">
                                <div className="w-16 h-16 mx-auto bg-slate-50 rounded-2xl flex items-center justify-center shadow-sm">
                                    <item.icon className={`w-8 h-8 ${item.color}`} />
                                </div>
                                <h3 className="font-bold text-xl text-slate-900">{item.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FEATURE ROW 1: ANALYTICS */}
            <FeatureRow
                title="Dados que provam o valor do RH"
                description="Mostre para a diretoria o ROI das suas ações. Saiba exatamente quais times estão engajados, quais comunicados performam melhor e identifique riscos de turnover antes que seja tarde."
                image={
                    <div className="bg-slate-50 p-8 rounded-xl shadow-lg border border-slate-100">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="flex-1">
                                <div className="text-sm text-slate-500 mb-1">Taxa de Leitura (Geral)</div>
                                <div className="text-3xl font-bold text-slate-900">84.2%</div>
                                <div className="text-xs text-green-600 font-bold flex items-center mt-1">
                                    <TrendingUp className="w-3 h-3 mr-1" /> +12% vs mês anterior
                                </div>
                            </div>
                            <div className="h-12 w-[1px] bg-slate-200"></div>
                            <div className="flex-1">
                                <div className="text-sm text-slate-500 mb-1">eNPS (Clima)</div>
                                <div className="text-3xl font-bold text-slate-900">+62</div>
                                <div className="text-xs text-slate-400 mt-1">Zona de Excelência</div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="h-2 bg-slate-200 rounded-full w-full overflow-hidden">
                                <div className="h-full bg-iuppy-blue w-[84%]"></div>
                            </div>
                            <div className="flex justify-between text-xs text-slate-400">
                                <span>Operação</span>
                                <span>84%</span>
                            </div>

                            <div className="h-2 bg-slate-200 rounded-full w-full overflow-hidden">
                                <div className="h-full bg-green-500 w-[92%]"></div>
                            </div>
                            <div className="flex justify-between text-xs text-slate-400">
                                <span>Administrativo</span>
                                <span>92%</span>
                            </div>

                            <div className="h-2 bg-slate-200 rounded-full w-full overflow-hidden">
                                <div className="h-full bg-red-400 w-[45%]"></div>
                            </div>
                            <div className="flex justify-between text-xs text-slate-400">
                                <span>Logística (Atenção!)</span>
                                <span>45%</span>
                            </div>
                        </div>
                    </div>
                }
                notes={[
                    "Dashboards exportáveis para reuniões de board",
                    "Mapas de calor de engajamento",
                    "Monitoramento de sentimento via IA"
                ]}
            />

            {/* FEATURE ROW 2: AUTOMATION */}
            <FeatureRow
                reversed
                title="Menos Burocracia, Mais Estratégia"
                description="Automatize as perguntas repetitivas. Holerites, avisos de férias e dúvidas frequentes são respondidos automaticamente pelo App ou Chatbot."
                image={
                    <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Coffee className="w-24 h-24" /></div>

                        <div className="space-y-4 relative z-10">
                            <div className="bg-slate-50 p-4 rounded-lg rounded-tl-none border border-slate-100 max-w-[80%]">
                                <p className="text-sm text-slate-600">Olá! Quando cai a segunda parcela do 13º?</p>
                            </div>
                            <div className="bg-iuppy-blue p-4 rounded-lg rounded-tr-none text-white max-w-[90%] ml-auto shadow-md">
                                <p className="text-sm font-medium">Oi, Ana! 🤖</p>
                                <p className="text-sm mt-1 opacity-90">A segunda parcela será depositada no dia <strong>20 de Dezembro</strong>.</p>
                                <div className="mt-3 bg-white/10 rounded px-3 py-2 text-xs flex items-center cursor-pointer hover:bg-white/20 transition-colors">
                                    <Star className="w-3 h-3 mr-2" /> Ver meu holerite agora
                                </div>
                            </div>
                        </div>
                    </div>
                }
                notes={[
                    "Entrega digital de Holerites e Informes",
                    "Chatbot treinado com suas políticas internas",
                    "Redução de 40% nos chamados ao RH"
                ]}
                gradient="from-orange-400 to-pink-500"
            />

            {/* SOCIAL PROOF / IMPACT */}
            <Section className="py-24 bg-slate-900 text-white border-t border-slate-800">
                <div className="container-custom text-center">
                    <h2 className="text-3xl font-bold mb-16">
                        O impacto de uma força de trabalho conectada
                    </h2>
                    <div className="grid md:grid-cols-4 gap-8 divide-x divide-slate-800">
                        <div>
                            <div className="text-4xl font-bold text-green-400 mb-2">-25%</div>
                            <div className="text-slate-400 text-sm">Turnover Voluntário</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-blue-400 mb-2">+4x</div>
                            <div className="text-slate-400 text-sm">Alcance da Comunicação</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-purple-400 mb-2">90%</div>
                            <div className="text-slate-400 text-sm">Adoção do App</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-orange-400 mb-2">-15h</div>
                            <div className="text-slate-400 text-sm">Por mês / analista de RH</div>
                        </div>
                    </div>
                </div>
            </Section>

            <NR1CrossSell variant="hr" />

            <PreFooterCTA />
        </>
    );
}
