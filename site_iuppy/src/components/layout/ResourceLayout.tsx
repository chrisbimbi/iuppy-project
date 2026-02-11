"use client";

import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";

interface ResourceLayoutProps {
    title: string;
    subtitle: string;
}

export default function ResourceLayout({ title, subtitle }: ResourceLayoutProps) {
    return (
        <Section className="bg-slate-50 min-h-screen py-32 text-center">
            <div className="container-custom max-w-2xl space-y-6">
                <div className="inline-block px-3 py-1 rounded-full bg-blue-100 text-iuppy-blue text-xs font-bold uppercase tracking-wider mb-4">
                    Em Breve
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900">{title}</h1>
                <p className="text-xl text-gray-600">{subtitle}</p>

                <div className="pt-8">
                    <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-left space-y-4">
                        <h3 className="font-bold text-lg">Quer ser avisado?</h3>
                        <p className="text-gray-500 text-sm">Inscreva-se para receber nossos melhores conteúdos sobre Comunicação Interna e RH Estratégico.</p>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                placeholder="seu@email.com"
                                className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-iuppy-blue"
                            />
                            <Button>Inscrever</Button>
                        </div>
                    </div>
                </div>
            </div>
        </Section>
    );
}
