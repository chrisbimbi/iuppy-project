"use client";

import { FeatureRow } from "@/components/ui/feature-row";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Coffee, Laptop, Heart, DollarSign, Rocket, Sun } from "lucide-react";
import Link from "next/link";
import { PreFooterCTA } from "@/components/layout/PreFooterCTA";

import { useState } from "react";
import { JobApplicationModal } from "@/components/careers/JobApplicationModal";

export default function CareersPage() {
    const [selectedJob, setSelectedJob] = useState<any>(null);
    const [isApplicationOpen, setApplicationOpen] = useState(false);

    const handleOpenApplication = (job: any) => {
        setSelectedJob(job);
        setApplicationOpen(true);
    };

    return (
        <>
            <JobApplicationModal
                isOpen={isApplicationOpen}
                onClose={() => setApplicationOpen(false)}
                job={selectedJob}
            />
            {/* HERO SECTION */}
            <Section className="bg-white pt-40 pb-24 relative overflow-hidden">
                <div className="container-custom relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="flex-1 space-y-6 text-center lg:text-left">
                            <span className="inline-block py-1 px-3 rounded-full bg-iuppy-orange/10 text-iuppy-orange font-bold text-sm tracking-wide">
                                ESTAMOS CONTRATANDO
                            </span>
                            <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 leading-tight tracking-tight">
                                Construa o sistema operacional da <br />
                                <span className="text-iuppy-blue">cultura corporativa.</span>
                            </h1>
                            <p className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                                Estamos construindo o <strong>maior movimento de Comunicação Inteligente da América Latina</strong>.
                                Junte-se a um time obcecado por eliminar ruídos e conectar pessoas.
                            </p>
                            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <Link href="#open-positions">
                                    <Button size="lg" className="h-14 px-8 text-lg font-bold bg-iuppy-orange text-white hover:bg-orange-600 shadow-xl">
                                        Ver Vagas Abertas
                                    </Button>
                                </Link>
                            </div>
                        </div>
                        <div className="flex-1 relative">
                            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-l from-blue-50 to-transparent -z-10 rounded-full blur-3xl opacity-50"></div>
                            <img
                                src="/assets/headers/careers_hero_v2.png"
                                alt="Time diverso colaborando com tecnologia de comunicação"
                                className="w-full h-auto drop-shadow-2xl hover:scale-105 transition-transform duration-700 rounded-2xl"
                            />
                        </div>
                    </div>
                </div>
            </Section>

            {/* CULTURE - SLATE BG */}
            <Section className="bg-slate-50 py-24">
                <div className="container-custom text-center mb-16">
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Por que a Iuppy?</h2>
                    <p className="text-slate-600 max-w-2xl mx-auto">
                        Não somos apenas mais uma SaaS. Somos uma empresa product-led growth com alma brasileira e ambição global.
                    </p>
                </div>

                <div className="container-custom grid md:grid-cols-3 gap-8">
                    {[
                        {
                            icon: Laptop,
                            title: "Remote-First",
                            desc: "Trabalhe de onde quiser. Acreditamos em entregas, não em horas de cadeira. Temos hubs em SP e Lisboa para quem curte escritório."
                        },
                        {
                            icon: Rocket,
                            title: "Crescimento Acelerado",
                            desc: "Crescemos 3x ao ano. Aqui você terá desafios que farão sua carreira avançar 5 anos em 1."
                        },
                        {
                            icon: Heart,
                            title: "Saúde Mental",
                            desc: "Terapia subsidiada, Gympass e respeito absoluto ao seu tempo de descanso. Burnout não é badge de honra."
                        },
                        {
                            icon: DollarSign,
                            title: "Salários Competitivos",
                            desc: "Pagamos acima da média de mercado, com bônus atrelado a performance global da empresa."
                        },
                        {
                            icon: Coffee,
                            title: "Ambiente Descontraído",
                            desc: "Sem dress code, sem burocracia desnecessária. Hierarquia horizontal onde a melhor ideia vence."
                        },
                        {
                            icon: Sun,
                            title: "Offsites Incríveis",
                            desc: "Duas vezes por ano reunimos a empresa toda em um lugar paradisíaco para planejar e celebrar."
                        },
                    ].map((v, i) => (
                        <div key={i} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-blue-50 text-iuppy-blue rounded-xl flex items-center justify-center mb-6">
                                <v.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">{v.title}</h3>
                            <p className="text-slate-600 leading-relaxed text-sm">{v.desc}</p>
                        </div>
                    ))}
                </div>
            </Section>

            {/* OPEN POSITIONS */}
            <Section id="open-positions" className="py-24 bg-white">
                <div className="container-custom max-w-4xl">
                    <div className="text-center mb-16">
                        <span className="text-iuppy-blue font-bold tracking-widest uppercase text-sm">Vagas Abertas</span>
                        <h2 className="text-4xl font-bold text-slate-900 mt-2">Venha crescer com a gente</h2>
                    </div>

                    <div className="space-y-4">
                        {[
                            {
                                role: "SDR - Sales Development Rep.",
                                dept: "Vendas",
                                loc: "Remoto (Brasil)",
                                desc: "Você será o caçador de oportunidades. Seu foco é prospecção ativa (outbound) e qualificação de leads. Buscamos 'Hunters' nativos.",
                                highlight: "Comissões mais agressivas do mercado (sem teto).",
                                hrTech: true
                            },
                            {
                                role: "Closer (Account Executive)",
                                dept: "Vendas",
                                loc: "Híbrido (São Paulo)",
                                desc: "Fechamento de contratos Enterprise com Diretores de RH e C-Level. Venda consultiva e de alto valor agregado (High Ticket).",
                                highlight: "Comissões mais agressivas do mercado (sem teto).",
                                hrTech: true
                            },
                            {
                                role: "Senior Frontend Engineer",
                                dept: "Engenharia",
                                loc: "Remoto",
                                desc: "Liderar a arquitetura do nosso app (React/Next.js). Construir interfaces fluidas e performáticas que encantam usuários.",
                                hrTech: true
                            },
                            {
                                role: "Product Manager (Mobile)",
                                dept: "Produto",
                                loc: "Remoto",
                                desc: "Definir o roadmap do app do colaborador. Traduzir dores de 'deskless workers' em features engajadoras.",
                                hrTech: true
                            },
                            {
                                role: "CS Manager (Onboarding)",
                                dept: "Customer Success",
                                loc: "Remoto",
                                desc: "Garantir que novos clientes tenham o 'Time to Value' mais rápido do mercado. Implementação e treinamento.",
                                hrTech: true
                            },
                        ].map((job, i) => (
                            <div key={i} className="group flex flex-col md:flex-row md:items-center justify-between p-6 rounded-xl border border-slate-200 hover:border-iuppy-orange hover:shadow-lg transition-all cursor-pointer bg-white">
                                <div className="space-y-3 max-w-2xl">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h3 className="font-bold text-xl text-slate-900 group-hover:text-iuppy-orange transition-colors">
                                            {job.role}
                                        </h3>
                                        {job.highlight && (
                                            <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wide rounded">
                                                💰 {job.highlight}
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-slate-600 text-sm leading-relaxed">
                                        {job.desc}
                                    </p>

                                    <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500">
                                        <div className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                                            {job.dept}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                                            {job.loc}
                                        </div>
                                        {job.hrTech && (
                                            <div className="flex items-center gap-1 text-iuppy-blue">
                                                <span className="w-2 h-2 rounded-full bg-iuppy-blue"></span>
                                                Preferência por exp. em HR Tech
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-6 md:mt-0">
                                    <Button
                                        onClick={() => handleOpenApplication(job)}
                                        className="w-full md:w-auto bg-slate-900 text-white font-bold hover:bg-iuppy-orange transition-colors"
                                    >
                                        Ver Detalhes &rarr;
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-12">
                        <p className="text-slate-500 mb-4">Não achou sua vaga?</p>
                        <Button variant="outline" className="border-slate-300 text-slate-600">
                            Cadastre-se no Banco de Talentos
                        </Button>
                    </div>
                </div>
            </Section>

            <PreFooterCTA />
        </>
    );
}
