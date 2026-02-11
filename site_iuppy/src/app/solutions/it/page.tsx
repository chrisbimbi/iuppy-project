"use client";

import { useState } from "react";
import { DemoModal } from "@/components/conversion/DemoModal";
import { FeatureRow } from "@/components/ui/feature-row";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Shield, Lock, Server, RefreshCw, Zap, Code2, FileKey, Terminal, MessageSquare } from "lucide-react";
import Link from "next/link";
import { PreFooterCTA } from "@/components/layout/PreFooterCTA";
import { NR1CrossSell } from "@/components/sections/NR1CrossSell";

export default function ITPage() {
    const [isDemoOpen, setDemoOpen] = useState(false);

    return (
        <>
            <DemoModal isOpen={isDemoOpen} onClose={() => setDemoOpen(false)} />
            {/* HERRO SECTION */}
            <Section className="bg-slate-900 text-white pt-40 pb-24 border-b border-white/10 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: "radial-gradient(#4f46e5 1px, transparent 1px)", backgroundSize: "32px 32px" }}>
                </div>

                <div className="container-custom relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-12">
                        <div className="flex-1 space-y-8 text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-green-500/30 bg-green-900/20 text-green-400 text-sm font-mono tracking-wider mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <Terminal className="w-4 h-4" />
                                <span>INFRAESTRUTURA GOOGLE CLOUD</span>
                            </div>

                            <h1 className="text-5xl lg:text-7xl font-bold leading-tight tracking-tight">
                                Tão seguro e fácil, <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">que até o TI ama.</span>
                            </h1>

                            <p className="text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                                Esqueça longos projetos de implantação. A Iuppy roda 100% na nuvem do Google, integra com seu ERP via API e não gera chamados no seu helpdesk.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                                <Button onClick={() => setDemoOpen(true)} size="lg" className="h-14 px-8 text-lg font-bold bg-green-500 hover:bg-green-600 text-slate-900 shadow-xl shadow-green-500/20">
                                    Veja na prática
                                </Button>
                            </div>
                        </div>
                        <div className="flex-1 relative">
                            <div className="relative z-10 animate-in fade-in zoom-in duration-1000 delay-200">
                                <img
                                    src="/assets/headers/it.png"
                                    alt="IT Professional with Security UI"
                                    className="w-full h-auto drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                            {/* Glow behind image */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-green-500/20 blur-[100px] -z-10 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </Section>

            {/* PAIN POINTS / SOLUTIONS GRID */}
            <div className="bg-slate-50 py-24 border-b border-gray-200">
                <div className="container-custom">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">
                            Sua fila de tickets agradece
                        </h2>
                        <p className="text-slate-600 text-lg">
                            Dê autonomia para o RH. Eles publicam conteúdo, gerenciam usuários e extraem relatórios sem precisar pedir "favor" para a TI.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                title: "Zero Setup de Servidor",
                                icon: Server,
                                color: "text-blue-600",
                                bg: "bg-blue-100",
                                desc: "Nada de provisionar VM ou configurar Banco de Dados. É Serverless, rodando no Google Cloud. 99.9% de Uptime garantido."
                            },
                            {
                                title: "Integrações Nativas",
                                icon: Zap,
                                color: "text-green-600",
                                bg: "bg-green-100",
                                desc: "Conectores prontos para os principais ERPs e Provedores de Identidade. Plug & Play de verdade, sem gambiarras."
                            },
                            {
                                title: "Segurança Google",
                                icon: Shield,
                                color: "text-purple-600",
                                bg: "bg-purple-100",
                                desc: "Aproveite a mesma infraestrutura de segurança que protege o Gmail e o Google Search. Proteção DDoS Cloud Armor inclusa."
                            },
                        ].map((item, i) => (
                            <div key={i} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-lg hover:-translate-y-1 transition-transform duration-300">
                                <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center mb-6`}>
                                    <item.icon className={`w-7 h-7 ${item.color}`} />
                                </div>
                                <h3 className="font-bold text-xl mb-3 text-slate-900">{item.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FEATURE DEEP DIVE 1: INTEGRATION */}
            <FeatureRow
                title="Sincronização de Usuários em Tempo Real"
                description="Não perca tempo criando contas manualmente. Conecte seu provedor de identidade e deixe a automação trabalhar."
                image={
                    <div className="bg-slate-900 h-80 rounded-xl flex items-center justify-center font-mono text-sm p-8 shadow-2xl overflow-hidden relative border border-slate-700">
                        <div className="absolute top-0 left-0 w-full h-8 bg-slate-800 flex items-center px-4 gap-2 border-b border-slate-700">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                        </div>
                        <div className="w-full space-y-2 mt-4 text-green-400 opacity-90">
                            <p><span className="text-blue-400">➜</span> <span className="text-yellow-400">iuppy-sync</span> start --provider azure-ad</p>
                            <p className="text-slate-400">[INFO] Connecting to Microsoft Graph API...</p>
                            <p className="text-slate-400">[INFO] Fetching organizational units...</p>
                            <p className="text-slate-400">[INFO] Found 1,240 active users</p>
                            <p className="text-slate-400">[INFO] Syncing groups: "Directors", "HR", "IT_Support"</p>
                            <p><span className="text-green-500">✔</span> Sync completed in 1.4s</p>
                            <p><span className="text-blue-400">➜</span> _</p>
                        </div>
                    </div>
                }
                notes={[
                    "Provisionamento via SCIM 2.0",
                    "Mapeamento Automático de Grupos e Cargos",
                    "Desativação Imediata (Offboarding Seguro)"
                ]}
            />

            {/* FEATURE DEEP DIVE 2: SSO */}
            <FeatureRow
                reversed
                title="Single Sign-On (SSO) Nativo"
                description="Uma senha a menos para seus colaboradores esquecerem. Suporte nativo aos principais protocolos de autenticação do mercado."
                image={
                    <div className="bg-white border border-gray-200 h-80 rounded-xl p-8 flex flex-col justify-center items-center gap-6 shadow-lg">
                        <div className="text-slate-400 font-medium text-sm">Logar com sua conta corporativa</div>
                        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                            <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50 opacity-50 cursor-not-allowed">
                                <div className="w-6 h-6 bg-blue-600 rounded"></div>
                                <span className="font-bold text-slate-700">Microsoft</span>
                            </div>
                            <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50 opacity-50 cursor-not-allowed">
                                <div className="w-6 h-6 bg-red-500 rounded"></div>
                                <span className="font-bold text-slate-700">Google</span>
                            </div>
                        </div>
                        <div className="relative w-full max-w-sm">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Protocolos Suportados</span></div>
                        </div>
                        <div className="flex gap-4 font-mono text-xs font-bold text-iuppy-blue">
                            <span className="bg-blue-50 px-3 py-1 rounded">SAML 2.0</span>
                            <span className="bg-blue-50 px-3 py-1 rounded">OIDC</span>
                            <span className="bg-blue-50 px-3 py-1 rounded">LDAP</span>
                        </div>
                    </div>
                }
                notes={[
                    "Compatível com Okta, Azure AD, OneLogin",
                    "Autenticação Multifator (MFA) suportada",
                    "Login simplificado via QR Code para Frontline"
                ]}
                gradient="from-blue-600 to-indigo-700"
            />

            {/* TECHNICAL SPECS TABLE */}
            <Section className="py-24 bg-slate-900 text-white">
                <div className="container-custom max-w-4xl">
                    <h2 className="text-3xl font-bold mb-12 text-center">Infraestrutura Google Cloud (GCP)</h2>

                    <div className="grid md:grid-cols-2 gap-0 border border-slate-700 rounded-xl overflow-hidden">
                        {[
                            { label: "Cloud Provider", val: "Google Cloud Platform (South America)" },
                            { label: "Banco de Dados", val: "Google Cloud SQL (PostgreSQL Enterprise)" },
                            { label: "Criptografia", val: "AES-256 (Google Managed Keys)" },
                            { label: "Proteção DDoS", val: "Google Cloud Armor" },
                            { label: "Compliance", val: "ISO 27001, SOC 2, LGPD" },
                            { label: "Disponibilidade", val: "Multi-Region Redundancy" },
                        ].map((spec, i) => (
                            <div key={i} className="flex justify-between items-center p-6 border-b border-r border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-colors">
                                <span className="text-slate-400 font-mono text-sm">{spec.label}</span>
                                <span className="font-bold text-green-400">{spec.val}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </Section>

            {/* FINAL CTA */}
            <NR1CrossSell variant="it" />
            <PreFooterCTA />
        </>
    );
}
