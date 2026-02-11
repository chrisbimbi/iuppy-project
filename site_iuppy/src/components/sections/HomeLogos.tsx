"use client";

import { Section } from "@/components/ui/section";

export function HomeLogos() {
    return (
        <div className="py-12 bg-gray-50/50 border-b border-gray-100 overflow-hidden">
            <div className="container-custom text-center">
                <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-8">Empresas que confiam na Iuppy</p>
                <div className="flex justify-center gap-12 opacity-50 grayscale flex-wrap">
                    {/* Ideally replace with real SVGs */}
                    <div className="text-2xl font-bold font-serif text-gray-400">GESTAMP</div>
                    <div className="text-2xl font-bold font-mono text-gray-400">RENAULT</div>
                    <div className="text-2xl font-bold font-sans text-gray-400">UNILEVER</div>
                    <div className="text-2xl font-bold font-serif text-gray-400">HOSPITAL SÍRIO</div>
                    <div className="text-2xl font-bold font-mono text-gray-400">VALE</div>
                    <div className="text-2xl font-bold font-sans text-gray-400">PETROBRAS</div>
                </div>
            </div>
        </div>
    );
}
