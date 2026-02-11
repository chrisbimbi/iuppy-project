"use client";

import { useState } from "react";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { DemoModal } from "@/components/conversion/DemoModal";

export function BookingSection() {
    const [isDemoOpen, setDemoOpen] = useState(false);

    return (
        <Section className="bg-iuppy-blue text-white py-32 relative overflow-hidden">
            <DemoModal isOpen={isDemoOpen} onClose={() => setDemoOpen(false)} />

            {/* Decorative Circles */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-iuppy-orange/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>
            </div>

            <div className="container-custom relative z-10 text-center max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
                        Pare de gerenciar o caos. <br /> Comece a liderar a estratégia.
                    </h2>
                    <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-2xl mx-auto">
                        Agende uma demonstração gratuita e descubra como a CI Ativa™ pode economizar até 30% do tempo do seu RH.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Button
                            size="lg"
                            variant="secondary"
                            onClick={() => setDemoOpen(true)}
                            className="h-16 px-10 text-lg shadow-xl shadow-orange-900/20 hover:scale-105 transition-transform"
                        >
                            <Calendar className="w-5 h-5 mr-2" />
                            Agendar Demonstração Agora
                        </Button>
                        <span className="text-blue-200 text-sm">
                            Sem cartão de crédito • Cancelamento a qualquer momento
                        </span>
                    </div>
                </motion.div>
            </div>
        </Section>
    );
}
