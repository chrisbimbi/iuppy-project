"use client";

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Image as ImageIcon, Sparkles } from 'lucide-react';

export const openDemoModal = () => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('open-demo-modal'));
    }
};

export const LeadTrigger = ({ children, className }: { children: React.ReactNode, className?: string }) => {
    return (
        <span
            onClick={openDemoModal}
            className={cn("cursor-pointer text-iuppy-blue font-bold hover:underline decoration-iuppy-orange underline-offset-4", className)}
        >
            {children}
        </span>
    );
};

export const BlogCTA = () => {
    return (
        <div className="my-12 bg-slate-50 border border-iuppy-blue/20 rounded-2xl p-8 text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-iuppy-orange/10 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />
            <Sparkles className="mx-auto w-10 h-10 text-iuppy-orange mb-4" />
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Gostou da metodologia?</h3>
            <p className="text-slate-600 mb-6 max-w-lg mx-auto">
                Não deixe sua empresa parada no tempo. Automatize a comunicação e os processos de RH hoje mesmo.
            </p>
            <Button onClick={openDemoModal} size="lg" className="bg-iuppy-blue hover:bg-blue-600 font-bold text-white shadow-xl">
                Agendar Demonstração
            </Button>
        </div>
    )
}

export const PromptImage = ({ prompt, alt, title }: { prompt: string, alt: string, title?: string }) => {
    return (
        <figure className="my-10">
            <div className="relative aspect-video w-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex flex-col items-center justify-center p-8 group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

                <div className="z-10 text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <ImageIcon className="w-8 h-8 text-slate-400" />
                    </div>
                    <div className="space-y-2">
                        <div className="text-xs font-mono uppercase tracking-widest text-slate-500">Image Placeholder</div>
                        <p className="font-medium text-slate-900 italic max-w-2xl mx-auto">"{prompt}"</p>
                    </div>
                </div>

                {/* Banner for Nano Banana info */}
                <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 backdrop-blur-sm p-2 text-center transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <span className="text-xs text-white/90 font-mono">Generative AI Prompt Ready</span>
                </div>
            </div>
            {(title || alt) && <figcaption className="mt-3 text-center text-sm text-slate-500 italic">{title || alt}</figcaption>}
        </figure>
    )
}
