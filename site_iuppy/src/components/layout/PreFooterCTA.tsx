"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar, MessageSquare } from "lucide-react";
import { Section } from "@/components/ui/section";
import { DemoModal } from "@/components/conversion/DemoModal";

export interface PreFooterCTAProps {
    title?: string;
    subtitle?: string;
    ctaText?: string;
    ctaLink?: string;
}

export function PreFooterCTA({
    title = "Pronto para revolucionar sua comunicação?",
    subtitle = "Junte-se a empresas líderes que já conectaram 100% de seus colaboradores. A implementação leva menos de 2 semanas.",
    ctaText = "Agendar Demonstração",
    ctaLink
}: PreFooterCTAProps) {
    const [isDemoOpen, setDemoOpen] = useState(false);
    const router = useRouter();

    return (
        <Section className="py-24 bg-gradient-to-br from-iuppy-villain via-slate-900 to-blue-900 text-white relative overflow-hidden">
            <DemoModal isOpen={isDemoOpen} onClose={() => setDemoOpen(false)} />

            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/20 blur-[100px] rounded-full mix-blend-screen" />

            <div className="container-custom relative z-10 text-center">
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
                    {title}
                </h2>
                <p className="text-xl text-blue-200 max-w-2xl mx-auto mb-10 leading-relaxed">
                    {subtitle}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Button
                        onClick={() => ctaLink ? router.push(ctaLink) : setDemoOpen(true)}
                        size="lg"
                        className="h-16 px-8 text-lg font-bold bg-iuppy-blue hover:bg-blue-600 shadow-xl shadow-blue-900/50"
                    >
                        <Calendar className="mr-2 w-5 h-5" />
                        {ctaText}
                    </Button>

                    <Button variant="outline" size="lg" className="h-16 px-8 text-lg font-bold text-white border-white/20 hover:bg-white/10 backdrop-blur-sm">
                        <MessageSquare className="mr-2 w-5 h-5" />
                        Falar com Consultor
                    </Button>
                </div>

                <p className="mt-8 text-sm text-slate-400">
                    Sem cartão de crédito • Cancelamento a qualquer momento
                </p>
            </div>
        </Section>
    );
}
