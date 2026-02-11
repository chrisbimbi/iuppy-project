"use client";

import { Button } from "@/components/ui/button";
import { AppMockup } from "@/components/ui-mockups/AppMockup";
import { DashboardMockup } from "@/components/ui-mockups/DashboardMockup";
import { FeatureRow } from "@/components/ui/feature-row";
import { Section } from "@/components/ui/section";
import { CheckCircle2, Zap, Shield, Users, Lock, Mail, Puzzle } from "lucide-react";
import { PreFooterCTA } from "@/components/layout/PreFooterCTA";
import { NR1CrossSell } from "@/components/sections/NR1CrossSell";

export default function PlatformPage() {
    return (
        <>
            <Section className="bg-slate-50 pt-32 pb-20 text-center">
                <div className="container-custom max-w-4xl space-y-6">
                    <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
                        Uma Plataforma. <br />
                        <span className="text-iuppy-blue">Infinitas conexões.</span>
                    </h1>
                    <p className="text-xl text-gray-600">
                        O ecossistema completo para conectar colaboradores, digitalizar processos de RH e garantir compliance.
                    </p>
                </div>
            </Section>

            <FeatureRow
                id="app"
                title="App do Colaborador (White Label)"
                description="Seus colaboradores não querem baixar mais um app genérico. Entregue uma experiência 100% personalizada com a sua marca, suas cores e sua identidade."
                image={
                    <div className="bg-gray-50 flex items-center justify-center p-12">
                        <AppMockup />
                    </div>
                }
                notes={[
                    "Push Notifications Segmentados",
                    "Acesso sem e-mail corporativo (por CPF)",
                    "Timeline Social Estilo LinkedIn"
                ]}
            />

            <FeatureRow
                id="intranet"
                reversed
                title="Intranet Social & Dashboard"
                description="O centro de comando da sua Comunicação Interna. Publique notícias, gerencie documentos e acompanhe métricas de engajamento em tempo real."
                image={
                    <div className="bg-gray-50 flex items-center justify-center overflow-hidden h-[500px] relative">
                        {/* Force the mockup to render at a large desktop width, then scale it down to fit */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-[1100px] lg:w-[1300px] scale-[0.65] md:scale-[0.75] lg:scale-[0.7] xl:scale-[0.8] origin-center shadow-2xl rounded-xl">
                                <DashboardMockup />
                            </div>
                        </div>
                    </div>
                }
                notes={[
                    "CMS Drag-and-Drop intuitivo",
                    "Gestão de Acessos Granular",
                    "Analytics de Leitura por Área"
                ]}
                gradient="from-orange-400 to-red-400"
            />

            <FeatureRow
                id="push"
                title="Alcance Instantâneo com Push"
                description="O colaborador recebe na hora, onde quer que ele esteja! Esqueça os e-mails não lidos e garanta que sua mensagem chegue a quem realmente importa com segmentação precisa."
                image={
                    <div className="relative h-[400px] w-full rounded-xl overflow-hidden shadow-2xl group">
                        {/* Background Image: Factory Worker */}
                        <img
                            src="/assets/factory_worker.png"
                            alt="Colaborador na fábrica recebendo notificação"
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />

                        {/* IOS Push Notification Overlay */}
                        <div className="absolute top-8 right-8 z-20">
                            {/* Notification Body */}
                            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-2xl w-64 animate-in slide-in-from-right-10 fade-in duration-700 border border-white/20 transform hover:scale-105 transition-transform cursor-default">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-1.5">
                                        <div className="bg-iuppy-blue rounded-[5px] p-0.5 shadow-sm">
                                            <Zap className="w-2.5 h-2.5 text-white fill-current" />
                                        </div>
                                        <span className="text-[9px] font-bold text-gray-600 uppercase tracking-wider">IUPPY</span>
                                    </div>
                                    <span className="text-[9px] text-gray-500">AGORA</span>
                                </div>
                                <div className="space-y-0.5">
                                    <h4 className="font-semibold text-gray-900 text-xs">⚠️ Comunicado de Segurança</h4>
                                    <p className="text-[11px] text-gray-700 leading-snug">
                                        Uso obrigatório de EPI na nova área.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                }
                notes={[
                    "Disparos segmentados por cargo, unidade ou setor",
                    "Notificações instantâneas na tela do celular",
                    "Confirmação de leitura em tempo real"
                ]}
                gradient="from-purple-500 to-indigo-500"
            />

            <FeatureRow
                id="analytics"
                reversed
                title="Analytics em Tempo Real"
                description="Pare de voar às cegas. Entenda exatamente quem leu, quem curtiu e quais departamentos estão mais engajados com sua comunicação."
                image={
                    <div className="bg-gray-50 p-6 md:p-8 flex items-center justify-center rounded-xl overflow-hidden shadow-lg border border-gray-100">
                        <div className="bg-white w-full max-w-lg rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">

                            {/* Header */}
                            <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                                <div>
                                    <div className="text-xs font-bold text-iuppy-orange uppercase tracking-wider mb-1">Relatório de Conteúdo</div>
                                    <h3 className="font-bold text-gray-800 text-lg">Campanha de Vacinação 2025</h3>
                                </div>
                                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                                    Ativo
                                </div>
                            </div>

                            {/* Key Metrics Grid */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <div className="text-xs text-slate-500 font-medium mb-1">Visualizações</div>
                                    <div className="text-xl font-extrabold text-iuppy-blue">1.240</div>
                                </div>
                                <div className="p-3 bg-purple-50 rounded-lg">
                                    <div className="text-xs text-slate-500 font-medium mb-1">Leituras</div>
                                    <div className="text-xl font-extrabold text-purple-600">85%</div>
                                </div>
                                <div className="p-3 bg-orange-50 rounded-lg">
                                    <div className="text-xs text-slate-500 font-medium mb-1">Reações</div>
                                    <div className="text-xl font-extrabold text-orange-600">432</div>
                                </div>
                            </div>

                            {/* Breakdown Chart */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-700 mb-4">Engajamento por Setor</h4>
                                <div className="space-y-3">
                                    {/* Item 1 */}
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="font-medium text-gray-600">Recursos Humanos</span>
                                            <span className="font-bold text-gray-800">100%</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-green-500 w-full rounded-full" />
                                        </div>
                                    </div>
                                    {/* Item 2 */}
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="font-medium text-gray-600">Tecnologia & Produto</span>
                                            <span className="font-bold text-gray-800">92%</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 w-[92%] rounded-full" />
                                        </div>
                                    </div>
                                    {/* Item 3 */}
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="font-medium text-gray-600">Operações</span>
                                            <span className="font-bold text-gray-800">78%</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-orange-400 w-[78%] rounded-full" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                }
                notes={[
                    "Dashboards exportáveis (PDF/Excel)",
                    "Mapa de calor de engajamento",
                    "Feedback instantâneo via enquetes"
                ]}
                gradient="from-green-400 to-emerald-600"
            />

            <FeatureRow
                id="integrations"
                title="Integrações Poderosas"
                description="Iuppy fala a língua dos seus sistemas. Conecte-se nativamente com as ferramentas que sua empresa já usa."
                image={
                    <div className="bg-slate-50 p-8 flex flex-wrap gap-4 items-center justify-center min-h-[300px] rounded-xl">
                        <Puzzle className="w-12 h-12 text-slate-400" />
                        <span className="text-2xl font-bold text-slate-300">Sharepoint</span>
                        <span className="text-2xl font-bold text-slate-300">ADP</span>
                        <span className="text-2xl font-bold text-slate-300">SAP</span>
                        <span className="text-2xl font-bold text-slate-300">Workday</span>
                    </div>
                }
                notes={[
                    "Sincronização de usuários (AD/Azure)",
                    "Embed de documentos do Sharepoint e Drive",
                    "Webhooks para automações personalizadas"
                ]}
                gradient="from-cyan-400 to-blue-600"
            />

            <FeatureRow
                id="security"
                reversed
                title="Segurança Enterprise"
                description="Proteção de dados em nível bancário. Estamos preparados para atender aos requisitos mais rigorosos de TI e Compliance."
                image={
                    <div className="bg-slate-950 p-12 flex items-center justify-center rounded-xl overflow-hidden relative group h-[400px]">
                        {/* Abstract Background Animation */}
                        <div className="absolute inset-0 opacity-20">
                            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_#3b82f6_0%,_transparent_50%)] animate-pulse" />
                            <div className="absolute grid grid-cols-6 grid-rows-6 w-full h-full gap-1 opacity-30">
                                {Array.from({ length: 36 }).map((_, i) => (
                                    <div key={i} className="bg-blue-500/10 rounded-sm" />
                                ))}
                            </div>
                        </div>

                        {/* Central Animated Shield */}
                        <div className="relative z-10 flex flex-col items-center justify-center">
                            <div className="relative">
                                {/* Pulsing Rings */}
                                <div className="absolute -inset-4 bg-blue-500/20 rounded-full animate-ping duration-1000" />
                                <div className="absolute -inset-8 bg-blue-500/10 rounded-full animate-pulse delay-75" />

                                {/* Main Icon */}
                                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-6 rounded-2xl shadow-2xl border border-blue-400/30 backdrop-blur-sm">
                                    <Shield className="w-16 h-16 text-white drop-shadow-md" strokeWidth={1.5} />
                                </div>

                                {/* Floating Status Indicator */}
                                <div className="absolute -bottom-2 -right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg border border-green-400 animate-bounce">
                                    SECURE
                                </div>
                            </div>
                        </div>
                    </div>
                }
                notes={[
                    "Em conformidade com a LGPD",
                    "Segurança baseada na ISO 27001",
                    "Criptografia de ponta a ponta"
                ]}
                gradient="from-slate-600 to-gray-800"
            />

            <NR1CrossSell variant="general" />
            <PreFooterCTA />
        </>
    );
}
