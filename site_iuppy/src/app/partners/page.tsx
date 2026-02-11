"use client";

import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Handshake, Search, TrendingUp, Users, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { PreFooterCTA } from "@/components/layout/PreFooterCTA";

export default function PartnersPage() {
    return (
        <>
            {/* HERO SECTION */}
            <Section className="bg-slate-900 text-white pt-40 pb-24 relative overflow-hidden">
                <div className="container-custom relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="flex-1 relative">
                            <div className="absolute inset-0 bg-iuppy-orange/20 blur-[100px] rounded-full -z-10"></div>
                            <img
                                src="/assets/headers/partners_hero.png"
                                alt="Parceria Estratégica"
                                className="w-full h-auto drop-shadow-2xl rounded-lg border border-slate-700/50"
                            />
                        </div>
                        <div className="flex-1 space-y-6 text-center lg:text-left">
                            <span className="text-iuppy-orange font-bold tracking-widest uppercase text-sm">Parcerias</span>
                            <h1 className="text-5xl lg:text-7xl font-bold leading-tight tracking-tight">
                                Cresça junto <br />
                                com a Iuppy.
                            </h1>
                            <p className="text-xl text-slate-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
                                Junte-se ao ecossistema de Employee Experience que mais cresce na América Latina.
                                Expanda seu portfólio, gere receita recorrente e entregue inovação.
                            </p>
                        </div>
                    </div>
                </div>
            </Section>

            {/* DUAL PATH - KEY SECTION */}
            <Section className="bg-white py-24 -mt-12 relative z-20">
                <div className="container-custom">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* CARD 1: BECOME A PARTNER */}
                        <div className="bg-slate-50 rounded-2xl p-10 border border-slate-200 hover:shadow-xl transition-shadow flex flex-col items-start text-left group">
                            <div className="w-16 h-16 bg-iuppy-blue text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                                <Handshake className="w-8 h-8" />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">Quero ser Parceiro</h2>
                            <p className="text-slate-600 mb-8 leading-relaxed">
                                Você é uma consultoria de RH, agência de Endomarketing ou revendedor de software?
                                O programa de canais da Iuppy oferece comissões agressivas, treinamento e suporte dedicado.
                            </p>
                            <Button className="mt-auto bg-iuppy-blue text-white hover:bg-blue-700 w-full md:w-auto h-12 text-lg">
                                Aplicar Agora
                            </Button>
                        </div>

                        {/* CARD 2: FIND A PARTNER */}
                        <div className="bg-slate-900 rounded-2xl p-10 border border-slate-800 hover:shadow-xl transition-shadow flex flex-col items-start text-left text-white group">
                            <div className="w-16 h-16 bg-iuppy-orange text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                                <Search className="w-8 h-8" />
                            </div>
                            <h2 className="text-3xl font-bold mb-4">Buscar um Parceiro</h2>
                            <p className="text-slate-400 mb-8 leading-relaxed">
                                Precisa de ajuda estratégica para implementar a Iuppy ou desenhar sua campanha de comunicação interna?
                                Encontre especialistas certificados em nossa rede.
                            </p>
                            <Button variant="outline" className="mt-auto border-white text-white hover:bg-white hover:text-slate-900 w-full md:w-auto h-12 text-lg">
                                Encontrar Especialista
                            </Button>
                        </div>
                    </div>
                </div>
            </Section>

            {/* BENEFITS GRID */}
            <Section className="bg-slate-50 py-24 border-t border-slate-200">
                <div className="container-custom text-center mb-16">
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Por que ser nosso parceiro?</h2>
                </div>

                <div className="container-custom grid md:grid-cols-3 gap-12">
                    <div className="text-center px-4">
                        <div className="w-16 h-16 mx-auto bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                            <TrendingUp className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-3">Receita Recorrente</h3>
                        <p className="text-slate-600">
                            Ganhe até 30% de comissão sobre a mensalidade do cliente, por toda a vida do contrato.
                        </p>
                    </div>

                    <div className="text-center px-4">
                        <div className="w-16 h-16 mx-auto bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-6">
                            <Users className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-3">Geração de Leads</h3>
                        <p className="text-slate-600">
                            Clientes Iuppy frequentemente precisam de serviços consultivos. Nós indicamos parceiros certificados ativamente.
                        </p>
                    </div>

                    <div className="text-center px-4">
                        <div className="w-16 h-16 mx-auto bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
                            <ShieldCheck className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-3">Produto Confiável</h3>
                        <p className="text-slate-600">
                            Venda uma solução estável, segura e amada pelos usuários (NPS 78). Sua reputação está segura conosco.
                        </p>
                    </div>
                </div>
            </Section>

            <PreFooterCTA
                title="Pronto para escalar seu negócio?"
                subtitle="Cadastre-se no programa de parceiros e comece a ofertar a Iuppy hoje mesmo."
                ctaText="Seja um Parceiro"
                ctaLink="/contact"
            />
        </>
    );
}
