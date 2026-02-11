"use client";

import { FeatureRow } from "@/components/ui/feature-row";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Trophy, GraduationCap, Zap, Store, Tag } from "lucide-react";
import Link from "next/link";
import { PreFooterCTA } from "@/components/layout/PreFooterCTA";
import { NR1CrossSell } from "@/components/sections/NR1CrossSell";

export default function RetailPage() {
    return (
        <>
            {/* HERO SECTION */}
            <Section className="bg-slate-900 text-white pt-40 pb-24 border-b border-white/10 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900/40 to-pink-900/40 opacity-50"></div>

                <div className="container-custom relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-12">
                        <div className="flex-1 space-y-8 text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-400/30 bg-purple-900/20 text-purple-300 text-sm font-bold tracking-wider mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <ShoppingBag className="w-4 h-4" />
                                <span>VAREJO & FRANQUIAS</span>
                            </div>

                            <h1 className="text-5xl lg:text-7xl font-extrabold text-white leading-tight tracking-tight">
                                Transforme vendedores <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">em embaixadores da marca.</span>
                            </h1>

                            <p className="text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                                Conecte suas lojas espalhadas pelo Brasil em um único hub.
                                Divulgue campanhas, treine sobre novos produtos e celebre metas batidas em tempo real.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                                <Link href="/pricing">
                                    <Button size="lg" className="h-14 px-8 text-lg font-bold bg-white text-slate-900 hover:bg-purple-50 shadow-xl">
                                        Ver Solução para Varejo
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <div className="flex-1 relative">
                            <div className="relative z-10 animate-in fade-in zoom-in duration-1000 delay-200">
                                <img
                                    src="/assets/headers/retail.png"
                                    alt="Retail sales associate happy"
                                    className="w-full h-auto drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                            {/* Energetic Glow */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-purple-500/20 blur-[100px] -z-10 rounded-full"></div>
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
                                title: "Campanhas que Chegam",
                                icon: Zap,
                                desc: "Chega de imprimir cartaz que chega atrasado na loja. Publique a promoção no app e garanta que todo vendedor saiba o que vender hoje."
                            },
                            {
                                title: "Treinamento Ágil",
                                icon: GraduationCap,
                                desc: "Lançamento de coleção? Suba vídeos curtos e quizzes rápidos para garantir que o time domina os diferenciais do produto."
                            },
                            {
                                title: "Padronização Visual",
                                icon: Store,
                                desc: "Receba fotos da vitrine de cada unidade para garantir o Visual Merchandising perfeito em todas as praças."
                            },
                        ].map((item, i) => (
                            <div key={i} className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:-translate-y-2 transition-transform duration-300 shadow-sm hover:shadow-lg">
                                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg mb-6 text-white">
                                    <item.icon className="w-7 h-7" />
                                </div>
                                <h3 className="font-bold text-xl text-slate-900 mb-3">{item.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FEATURE DEEP DIVE: SALES & COMPETITION */}
            <FeatureRow
                title="Gamificação de Vendas"
                description="Crie competições saudáveis entre lojas ou regionais. Use rankings em tempo real e medalhas digitais para motivar o time a buscar a meta extra."
                image={
                    <div className="bg-slate-900 h-80 rounded-xl p-8 flex items-center justify-center relative overflow-hidden shadow-2xl border border-slate-800">
                        <div className="w-full max-w-xs space-y-4">
                            <div className="flex items-center justify-between text-yellow-400 mb-2">
                                <span className="font-bold uppercase tracking-widest text-xs">Ranking Nacional</span>
                                <Trophy className="w-5 h-5" />
                            </div>

                            {[
                                { name: "Loja Shopping Eldorado", points: "154%", color: "bg-yellow-500" },
                                { name: "Loja Barra Sul", points: "120%", color: "bg-slate-500" },
                                { name: "Loja Savassi", points: "105%", color: "bg-orange-700" },
                            ].map((store, i) => (
                                <div key={i} className="bg-slate-800 p-3 rounded-lg border border-slate-700 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-6 h-6 rounded-full ${store.color} text-white text-xs flex items-center justify-center font-bold`}>{i + 1}</div>
                                        <span className="text-white font-medium text-sm">{store.name}</span>
                                    </div>
                                    <span className="text-green-400 font-bold font-mono">{store.points}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                }
                notes={[
                    "Leaderboards em tempo real",
                    "Sistema de Pontos e Recompensas",
                    "Feed de 'Vendas Celebradas'"
                ]}
                gradient="from-purple-600 to-pink-600"
            />

            {/* FEATURE DEEP DIVE: MICROLEARNING */}
            <FeatureRow
                reversed
                title="Universidade Corporativa de Bolso"
                description="O turnover no varejo é alto. Acelere o onboarding de novos vendedores com trilhas de aprendizado móveis que eles podem fazer no tempo ocioso."
                image={
                    <div className="bg-white border border-gray-200 h-80 rounded-xl p-8 flex items-center justify-center relative overflow-hidden shadow-lg">
                        <div className="text-center w-full max-w-sm">
                            <div className="mb-6 flex justify-center">
                                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                                    <Tag className="w-8 h-8 text-purple-600" />
                                </div>
                            </div>
                            <h4 className="font-bold text-slate-900 text-lg mb-2">Coleção Verão 2026</h4>
                            <p className="text-slate-500 text-sm mb-6">Módulo 1: Tecidos Tecnológicos</p>

                            <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                                <div className="bg-purple-600 w-2/3 h-full rounded-full"></div>
                            </div>

                            <Button className="w-full bg-purple-600 hover:bg-purple-700 rounded-full">
                                Continuar Quiz (3/5)
                            </Button>
                        </div>
                    </div>
                }
                notes={[
                    "Vídeos curtos (Microlearning)",
                    "Quizzes para validação de conhecimento",
                    "Certificados digitais automáticos"
                ]}
                gradient="from-pink-400 to-purple-500"
            />

            <NR1CrossSell variant="retail" />
            <PreFooterCTA />
        </>
    );
}
