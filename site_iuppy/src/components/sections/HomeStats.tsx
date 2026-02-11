"use client";

import { Section } from "@/components/ui/section";
import { motion, useSpring, useTransform, useInView } from "framer-motion";
import { useEffect, useRef } from "react";

function Counter({ value, suffix = "" }: { value: number, suffix?: string }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });
    const spring = useSpring(0, { duration: 2000 });
    const displayValue = useTransform(spring, (current) => Math.floor(current).toLocaleString() + suffix);

    useEffect(() => {
        if (isInView) {
            spring.set(value);
        }
    }, [isInView, value, spring]);

    return <motion.span ref={ref}>{displayValue}</motion.span>;
}

export function HomeStats() {
    return (
        <Section className="bg-[#090648] text-white py-24 border-y border-white/10">
            <div className="container-custom">
                <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                        Impacto direto na última linha do balanço.
                    </h2>
                    <p className="text-xl text-blue-200">
                        Comunicação Interna não é apenas sobre engajamento. É sobre reduzir turnover, eliminar passivos trabalhistas e aumentar a produtividade operacional. Tração real para o seu negócio.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-12">
                    <div className="space-y-2">
                        <div className="text-6xl md:text-8xl font-bold text-iuppy-blue tracking-tighter">
                            <Counter value={98} suffix="%" />
                        </div>
                        <div className="text-lg font-medium text-blue-100">Taxa de Abertura de Push</div>
                    </div>

                    <div className="space-y-2">
                        <div className="text-6xl md:text-8xl font-bold text-purple-400 tracking-tighter">
                            +<Counter value={40} suffix="%" />
                        </div>
                        <div className="text-lg font-medium text-blue-100">Aumento no Engajamento</div>
                    </div>

                    <div className="space-y-2">
                        <div className="text-6xl md:text-8xl font-bold text-green-400 tracking-tighter">
                            <Counter value={3} suffix="x" />
                        </div>
                        <div className="text-lg font-medium text-blue-100">Mais Produtividade no RH</div>
                    </div>
                </div>
            </div>
        </Section>
    );
}
