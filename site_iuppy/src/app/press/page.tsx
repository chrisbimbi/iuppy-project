"use client";

import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Download, Mail, ExternalLink, FileText } from "lucide-react";
import Link from "next/link";
import { PreFooterCTA } from "@/components/layout/PreFooterCTA";

export default function PressPage() {
    return (
        <>
            {/* HERO SECTION */}
            <Section className="bg-slate-900 text-white min-h-[60vh] flex items-center justify-center relative overflow-hidden pt-24">
                <div className="absolute inset-0 z-0 opacity-40">
                    <img src="/assets/headers/press_hero.png" alt="Iuppy Newsroom" className="w-full h-full object-cover" />
                </div>
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent z-10"></div>

                <div className="container-custom relative z-20 text-center">
                    <span className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full text-sm font-bold tracking-widest uppercase mb-6 inline-block">
                        Newsroom
                    </span>
                    <h1 className="text-6xl lg:text-8xl font-black mb-6 tracking-tight">
                        Imprensa
                    </h1>
                    <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                        Últimas notícias, releases, assets da marca e contatos para jornalistas.
                    </p>
                </div>
            </Section>

            {/* LATEST NEWS GRID */}
            <Section className="bg-white py-24">
                <div className="container-custom">
                    <div className="flex justify-between items-end mb-12">
                        <h2 className="text-3xl font-bold text-slate-900">Últimos Releases</h2>
                        <Link href="/blog" className="text-iuppy-blue font-bold hover:underline flex items-center gap-1">
                            Ver Blog <ExternalLink className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Release 1 */}
                        <div className="group cursor-pointer">
                            <div className="aspect-video bg-slate-100 rounded-xl mb-4 overflow-hidden relative">
                                <div className="absolute top-4 left-4 bg-white px-3 py-1 rounded-md text-xs font-bold text-slate-900 shadow-sm">
                                    CORPORATIVO
                                </div>
                                {/* Placeholder for news image */}
                                <div className="w-full h-full bg-slate-200 group-hover:bg-slate-300 transition-colors flex items-center justify-center text-slate-400">
                                    <FileText className="w-12 h-12" />
                                </div>
                            </div>
                            <div className="text-sm text-slate-500 mb-2">08 Jan, 2026</div>
                            <h3 className="text-xl font-bold text-slate-900 group-hover:text-iuppy-blue transition-colors leading-tight">
                                Iuppy levanta Série B de R$ 150 Milhões para expandir operações na América Latina.
                            </h3>
                        </div>

                        {/* Release 2 */}
                        <div className="group cursor-pointer">
                            <div className="aspect-video bg-slate-100 rounded-xl mb-4 overflow-hidden relative">
                                <div className="absolute top-4 left-4 bg-white px-3 py-1 rounded-md text-xs font-bold text-slate-900 shadow-sm">
                                    PRODUTO
                                </div>
                                <div className="w-full h-full bg-slate-200 group-hover:bg-slate-300 transition-colors flex items-center justify-center text-slate-400">
                                    <FileText className="w-12 h-12" />
                                </div>
                            </div>
                            <div className="text-sm text-slate-500 mb-2">12 Dez, 2025</div>
                            <h3 className="text-xl font-bold text-slate-900 group-hover:text-iuppy-blue transition-colors leading-tight">
                                Lançamento do "Iuppy AI": Assistente de comunicação que escreve releases em segundos.
                            </h3>
                        </div>

                        {/* Release 3 */}
                        <div className="group cursor-pointer">
                            <div className="aspect-video bg-slate-100 rounded-xl mb-4 overflow-hidden relative">
                                <div className="absolute top-4 left-4 bg-white px-3 py-1 rounded-md text-xs font-bold text-slate-900 shadow-sm">
                                    PREMIAÇÃO
                                </div>
                                <div className="w-full h-full bg-slate-200 group-hover:bg-slate-300 transition-colors flex items-center justify-center text-slate-400">
                                    <FileText className="w-12 h-12" />
                                </div>
                            </div>
                            <div className="text-sm text-slate-500 mb-2">20 Nov, 2025</div>
                            <h3 className="text-xl font-bold text-slate-900 group-hover:text-iuppy-blue transition-colors leading-tight">
                                Iuppy é eleita uma das melhores empresas para se trabalhar (GPTW 2025).
                            </h3>
                        </div>
                    </div>
                </div>
            </Section>

            {/* MEDIA KIT & CONTACT */}
            <Section className="py-24 bg-slate-50 border-t border-slate-200">
                <div className="container-custom grid md:grid-cols-2 gap-12">
                    {/* Media Kit */}
                    <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="text-2xl font-bold text-slate-900 mb-4">Media Kit</h3>
                        <p className="text-slate-600 mb-8">
                            Baixe nossos logotipos oficiais, fotos dos fundadores e capturas de tela do produto em alta resolução.
                        </p>
                        <div className="flex flex-col gap-3">
                            <Button variant="outline" className="justify-start h-12 text-slate-700 bg-slate-50 border-slate-200">
                                <Download className="w-4 h-4 mr-2" /> Baixar Logo Pack (SVG/PNG)
                            </Button>
                            <Button variant="outline" className="justify-start h-12 text-slate-700 bg-slate-50 border-slate-200">
                                <Download className="w-4 h-4 mr-2" /> Baixar Fotos Executivas
                            </Button>
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="bg-iuppy-blue p-10 rounded-2xl text-white shadow-xl">
                        <h3 className="text-2xl font-bold mb-4">Assessoria de Imprensa</h3>
                        <p className="text-blue-100 mb-8">
                            É jornalista e precisa de uma fonte sobre Comunicação Interna, RH Tech ou Futuro do Trabalho? Fale com nosso time.
                        </p>
                        <a href="mailto:press@iuppy.com" className="inline-flex items-center gap-2 text-xl font-bold bg-white/10 px-6 py-3 rounded-lg hover:bg-white/20 transition-colors border border-white/20">
                            <Mail className="w-5 h-5" />
                            press@iuppy.com
                        </a>
                        <p className="text-sm text-blue-200 mt-6">
                            *Apenas para solicitações de mídia. Para suporte, use o canal de ajuda.
                        </p>
                    </div>
                </div>
            </Section>
        </>
    );
}
