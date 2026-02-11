"use client";

import { FeatureRow } from "@/components/ui/feature-row";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Users, Heart, Zap, BarChart3, Handshake, Brain, Rocket } from "lucide-react";
import Link from "next/link";
import { PreFooterCTA } from "@/components/layout/PreFooterCTA";
import { NR1CrossSell } from "@/components/sections/NR1CrossSell";

export default function AboutPage() {
    return (
        <>
            {/* HERO SECTION - MANIFESTO */}
            <Section className="bg-slate-900 text-white pt-40 pb-24 border-b border-white/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-iuppy-orange/10 to-slate-900/90 pointer-events-none"></div>
                <div className="container-custom relative z-10 text-center">
                    <div className="max-w-4xl mx-auto space-y-8">
                        <div className="inline-block bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 mb-4">
                            <span className="text-iuppy-orange font-bold text-sm tracking-widest uppercase">Nossa Visão</span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-bold leading-tight tracking-tight">
                            A Comunicação Interna <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-600 line-through decoration-white/50 decoration-4">Morreu.</span>
                        </h1>
                        <h2 className="text-4xl lg:text-6xl font-bold leading-tight tracking-tight text-emerald-400">
                            Vida longa à <br /> Comunicação Inteligente.
                        </h2>

                        <p className="text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto pt-4 border-t border-white/10 mt-8">
                            Estamos construindo o <strong>maior movimento de Comunicação Inteligente da América Latina</strong>.
                        </p>

                        <p className="text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto pt-4">
                            Sem dados, você navega no escuro. Sem métricas, o RH não senta à mesa estratégica.
                            Nós nascemos para enterrar o "achismo" e transformar a comunicação em uma máquina de gerar lucro.
                        </p>
                    </div>
                </div>
            </Section>

            {/* THE SHIFT - OLD VS NEW */}
            <Section className="bg-white py-24">
                <div className="container-custom">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <h3 className="text-3xl font-bold mb-6 text-slate-900">O que deixamos para trás</h3>
                            <div className="space-y-6">
                                <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 opacity-70 grayscale hover:grayscale-0 transition-all">
                                    <div className="mt-1"><Zap className="w-6 h-6 text-slate-400" /></div>
                                    <div>
                                        <h4 className="font-bold text-slate-600">O "Mural da Copa"</h4>
                                        <p className="text-sm text-slate-500">Avisos estáticos que ninguém lê e amarelam com o tempo.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 opacity-70 grayscale hover:grayscale-0 transition-all">
                                    <div className="mt-1"><Zap className="w-6 h-6 text-slate-400" /></div>
                                    <div>
                                        <h4 className="font-bold text-slate-600">E-mail "Para: Todos"</h4>
                                        <p className="text-sm text-slate-500">Caixas de entrada lotadas, ruído e zero engajamento real.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 opacity-70 grayscale hover:grayscale-0 transition-all">
                                    <div className="mt-1"><Zap className="w-6 h-6 text-slate-400" /></div>
                                    <div>
                                        <h4 className="font-bold text-slate-600">Gestão por Intuição</h4>
                                        <p className="text-sm text-slate-500">"Acho que o time gostou." Sem números, sem prova de ROI.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl opacity-20 blur-xl"></div>
                            <div className="bg-slate-900 text-white p-8 rounded-2xl relative border border-slate-800 shadow-2xl">
                                <h3 className="text-3xl font-bold mb-8 text-emerald-400">O futuro é agora</h3>
                                <div className="space-y-8">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                                            <BarChart3 className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg mb-1">Decisões baseadas em Dados</h4>
                                            <p className="text-slate-400">Analytics em tempo real para saber quem leu, quem entendeu e quem engajou.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                                            <Brain className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg mb-1">Hiper-segmentação</h4>
                                            <p className="text-slate-400">A mensagem certa, para a pessoa certa, no momento exato. Chega de spam corporativo.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                                            <Rocket className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg mb-1">Comunicação que gera Lucro</h4>
                                            <p className="text-slate-400">Menos turnover, mais produtividade, menos acidentes. O ROI é claro e mensurável.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Section>

            {/* PARTNERSHIP PHILOSOPHY */}
            <Section className="bg-slate-50 py-24 border-y border-slate-200">
                <div className="container-custom text-center max-w-4xl mx-auto">
                    <div className="w-16 h-16 bg-iuppy-orange/20 text-iuppy-orange rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
                        <Handshake className="w-8 h-8" />
                    </div>
                    <h2 className="text-4xl font-bold text-slate-900 mb-6">Não somos fornecedores.<br /> Somos sócios do seu problema.</h2>
                    <p className="text-xl text-slate-600 leading-relaxed mb-8">
                        Acreditamos na construção a 4 mãos. A relação fria de "contratante x contratado" não funciona para desafios complexos.
                        Nós somos seus amigos, seus parceiros, os "loucos" por tecnologia que vão dormir pensando em como resolver a dor do seu chão de fábrica.
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <span className="px-4 py-2 bg-white border border-slate-200 rounded-full text-slate-600 font-bold shadow-sm">#Proximidade</span>
                        <span className="px-4 py-2 bg-white border border-slate-200 rounded-full text-slate-600 font-bold shadow-sm">#Transparência</span>
                        <span className="px-4 py-2 bg-white border border-slate-200 rounded-full text-slate-600 font-bold shadow-sm">#ObcessãoNoSucesso</span>
                    </div>
                </div>
            </Section>

            {/* FOUNDER STORY */}
            <Section className="bg-white py-24 overflow-hidden">
                <div className="container-custom">
                    <div className="flex flex-col lg:flex-row gap-16 items-center">
                        <div className="flex-1 relative">
                            {/* Image */}
                            <div className="aspect-[3/4] rounded-2xl bg-slate-900 relative overflow-hidden shadow-2xl rotate-[-2deg] border-4 border-white group">
                                <img
                                    src="/assets/team/christiano.png"
                                    alt="Christiano Palmezan"
                                    className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent flex items-end p-8">
                                    <div className="text-white">
                                        <div className="font-bold text-2xl">Christiano Palmezan</div>
                                        <div className="text-sm opacity-80 font-medium text-iuppy-orange">Founder & CEO</div>
                                    </div>
                                </div>
                            </div>
                            {/* Decorative Element */}
                            <div className="absolute -z-10 top-10 -left-10 w-full h-full border-2 border-iuppy-blue/20 rounded-2xl rotate-[3deg]"></div>
                        </div>

                        <div className="flex-[1.5] space-y-8">
                            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900">
                                20 anos resolvendo <br />
                                <span className="text-iuppy-blue">problemas reais.</span>
                            </h2>

                            <div className="prose prose-lg text-slate-600">
                                <p>
                                    A Iuppy foi fundada por <strong>Christiano Palmezan</strong>, mas a história começa muito antes.
                                    Há mais de duas décadas, ele atua na intersecção entre comunicação, gestão de produtos e entrega de novas tecnologias.
                                </p>
                                <p>
                                    Christiano nunca se contentou com a superficialidade. Desde 2015, mergulhou profundamente no universo de
                                    <strong> Endomarketing e Employer Branding</strong> com uma missão clara: provar que a comunicação interna
                                    não é um centro de custo, mas um motor de resultados.
                                </p>
                                <p>
                                    Já ajudou centenas de empresas a transformarem seus ambientes de trabalho. Sua visão combinada de tecnologia
                                    e estratégia humana permitiu criar uma plataforma que não apenas "informa", mas conecta, engaja e capacita.
                                    Para ele, a tecnologia só faz sentido se resolver dores reais de pessoas reais.
                                </p>
                            </div>

                            <blockquote className="border-l-4 border-iuppy-orange pl-6 py-2 italic text-slate-800 text-lg">
                                "Nós não vendemos software. Nós vendemos a certeza de que a mensagem chegou, foi entendida e gerou ação."
                            </blockquote>
                        </div>
                    </div>
                </div>
            </Section>

            <PreFooterCTA
                title="Sua empresa está pronta para o futuro?"
                subtitle="Deixe o 'achismo' para trás. Venha fazer comunicação inteligente com a gente."
                ctaText="Falar com um Especialista"
                ctaLink="/contact"
            />
        </>
    );
}
