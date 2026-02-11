"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronRight, X } from "lucide-react";
import { useRouter } from "next/navigation";

export function DemoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        role: "Diretor de RH",
        employees: "100-500",
        painPoint: "Comunicação Fragmentada",
        timeline: "Imediato",
        budget: "Preciso de orçamento para aprovar"
    });

    const calculateScore = () => {
        let score = 0;

        // 1. Role (Max 30)
        if (["Diretor de RH", "CEO / Fundador"].includes(formData.role)) score += 30;
        else if (formData.role === "Gerente de RH") score += 20;
        else score += 10;

        // 2. Company Size (Max 30)
        if (["500 - 2.000", "Mais de 2.000"].includes(formData.employees)) score += 30;
        else if (formData.employees === "100 - 500") score += 20;
        else score += 5;

        // 3. Timeline (Max 20)
        if (formData.timeline === "Imediato") score += 20;
        else if (formData.timeline === "1-3 Meses") score += 15;
        else score += 5;

        // 4. Budget (Max 20)
        if (formData.budget === "Já tenho orçamento aprovado") score += 20;
        else if (formData.budget === "Preciso de orçamento para aprovar") score += 15;
        else score += 0;

        return score;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const score = calculateScore();
        console.log("Lead Score:", score, "Data:", formData);

        // Store score/data in localStorage to use on Thank You page if needed
        localStorage.setItem("lastLeadScore", score.toString());
        localStorage.setItem("lastLeadData", JSON.stringify(formData));

        try {
            await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, score })
            });
        } catch (err) {
            console.error("Failed to send lead to CRM", err);
        }

        router.push("/thank-you");
        onClose();
    };

    useEffect(() => {
        if (isOpen) setStep(1); // Reset on open
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-center justify-center lg:items-center px-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal Window */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
                >
                    <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors z-10">
                        <X className="w-6 h-6" />
                    </button>

                    {/* Header */}
                    <div className="bg-slate-50 p-6 border-b border-gray-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-iuppy-orange/5 rounded-full -translate-y-1/2 translate-x-1/2" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-sm font-bold text-iuppy-orange mb-2">
                                <span className="w-2 h-2 rounded-full bg-iuppy-orange animate-pulse" />
                                {step === 1 ? "Vamos começar?" : step === 2 ? "Sobre sua empresa" : "Últimos detalhes"}
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900">Agendar Demonstração</h2>
                            <p className="text-slate-600 text-sm mt-1">
                                {step === 3
                                    ? "Prometemos: sem spam, apenas estratégia."
                                    : "Descubra como a Iuppy economiza até 40h do seu RH por mês."
                                }
                            </p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="bg-gray-100 h-1 w-full">
                        <motion.div
                            className="h-full bg-iuppy-green"
                            initial={{ width: "33%" }}
                            animate={{ width: `${(step / 3) * 100}%` }}
                        />
                    </div>

                    {/* Body */}
                    <div className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-4">

                            {step === 1 && (
                                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Seu Nome</label>
                                        <input required type="text" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-iuppy-blue outline-none transition-all" placeholder="Ex: Ana Silva"
                                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">E-mail Corporativo</label>
                                        <input required type="email" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-iuppy-blue outline-none transition-all" placeholder="ana@empresa.com.br"
                                            value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <Button type="button" onClick={() => setStep(2)} className="w-full h-12 bg-iuppy-blue hover:bg-blue-600 text-white font-bold text-lg shadow-lg shadow-blue-500/20">
                                        Continuar <ChevronRight className="ml-2 w-5 h-5" />
                                    </Button>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Seu Cargo</label>
                                        <select className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-iuppy-blue outline-none bg-white"
                                            value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                            <option>Diretor de RH</option>
                                            <option>Gerente de RH</option>
                                            <option>Analista / Business Partner</option>
                                            <option>CEO / Fundador</option>
                                            <option>Consultor / Outro</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Nº de Colaboradores</label>
                                        <select className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-iuppy-blue outline-none bg-white"
                                            value={formData.employees} onChange={e => setFormData({ ...formData, employees: e.target.value })}>
                                            <option>Menos de 100</option>
                                            <option>100 - 500</option>
                                            <option>500 - 2.000</option>
                                            <option>Mais de 2.000</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Maior Desafio Hoje</label>
                                        <select className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-iuppy-blue outline-none bg-white"
                                            value={formData.painPoint} onChange={e => setFormData({ ...formData, painPoint: e.target.value })}>
                                            <option>Comunicação não chega na ponta</option>
                                            <option>Processos manuais (Férias/Holerite)</option>
                                            <option>Engajamento baixo nos canais atuais</option>
                                            <option>Adequação à NR-1</option>
                                            <option>Outro</option>
                                        </select>
                                    </div>
                                    <Button type="button" onClick={() => setStep(3)} className="w-full h-12 bg-iuppy-blue hover:bg-blue-600 text-white font-bold text-lg shadow-lg shadow-blue-500/20">
                                        Próximo Passo <ChevronRight className="ml-2 w-5 h-5" />
                                    </Button>
                                    <button type="button" onClick={() => setStep(1)} className="w-full text-center text-sm text-slate-400 hover:text-slate-600 mt-2">Voltar</button>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Quando pretende iniciar?</label>
                                        <select className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-iuppy-blue outline-none bg-white"
                                            value={formData.timeline} onChange={e => setFormData({ ...formData, timeline: e.target.value })}>
                                            <option>Imediato</option>
                                            <option>1-3 Meses</option>
                                            <option>3-6 Meses</option>
                                            <option>Apenas curiosidade</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Situação de Orçamento</label>
                                        <select className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-iuppy-blue outline-none bg-white"
                                            value={formData.budget} onChange={e => setFormData({ ...formData, budget: e.target.value })}>
                                            <option>Preciso de orçamento para aprovar</option>
                                            <option>Já tenho orçamento aprovado</option>
                                            <option>Ainda não tenho orçamento</option>
                                        </select>
                                    </div>

                                    <Button type="submit" className="w-full h-14 bg-iuppy-green hover:bg-green-600 text-white font-bold text-lg shadow-xl shadow-green-500/30 mt-4">
                                        <CheckCircle2 className="mr-2 w-6 h-6" />
                                        Finalizar Agendamento
                                    </Button>
                                    <button type="button" onClick={() => setStep(2)} className="w-full text-center text-sm text-slate-400 hover:text-slate-600 mt-2">Voltar</button>
                                </motion.div>
                            )}

                        </form>
                    </div>

                    {/* Footer Trust */}
                    <div className="bg-slate-50 p-4 border-t border-gray-100 flex items-center justify-center gap-4 text-xs text-slate-500 font-medium">
                        <div className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> Dados Criptografados</div>
                        <div className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> LGPD Compliance</div>
                    </div>

                </motion.div>
            </div>
        </AnimatePresence>
    );
}
