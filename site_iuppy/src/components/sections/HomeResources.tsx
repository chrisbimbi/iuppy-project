"use client";

import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Video } from "lucide-react";
import Link from "next/link";

export function HomeResources() {
    const resources = [
        {
            category: "E-book",
            title: "O Guia Definitivo da Comunicação Interna 2026",
            desc: "Descubra como a IA está transformando a forma como nos comunicamos no trabalho.",
            icon: BookOpen,
            color: "bg-blue-100 text-iuppy-blue"
        },
        {
            category: "Webinar",
            title: "Como a DHL engajou 10.000 motoristas",
            desc: "Assista ao case completo de transformação digital da gigante logística.",
            icon: Video,
            color: "bg-orange-100 text-orange-600"
        },
        {
            category: "Artigo",
            title: "NR-1: O que muda para o RH em Maio?",
            desc: "Evite multas e garanta o compliance da sua operação com nosso checklist.",
            icon: BookOpen,
            color: "bg-green-100 text-green-600"
        }
    ];

    return (
        <Section className="bg-white py-24">
            <div className="container-custom">
                <div className="flex justify-between items-end mb-12">
                    <div className="space-y-4">
                        <h2 className="text-3xl font-bold text-slate-900">Aprenda com especialistas</h2>
                        <p className="text-slate-500 max-w-xl">
                            Conteúdos gratuitos para ajudar você a transformar a cultura da sua empresa.
                        </p>
                    </div>
                    <Button variant="outline" className="hidden md:flex gap-2">
                        Ver todos os recursos <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {resources.map((res, i) => (
                        <Link key={i} href="#" className="group block bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${res.color}`}>
                                <res.icon className="w-6 h-6" />
                            </div>
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{res.category}</div>
                            <h3 className="font-bold text-xl text-slate-900 mb-3 group-hover:text-iuppy-blue transition-colors">
                                {res.title}
                            </h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                {res.desc}
                            </p>
                        </Link>
                    ))}
                </div>
            </div>
        </Section>
    );
}
