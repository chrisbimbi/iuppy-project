"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { CheckCircle2, UploadCloud } from "lucide-react";

interface Job {
    role: string;
    dept: string;
    loc: string;
    desc: string;
    highlight?: string;
    hrTech?: boolean;
}

interface JobApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    job: Job | null;
}

export function JobApplicationModal({ isOpen, onClose, job }: JobApplicationModalProps) {
    const [step, setStep] = useState<'details' | 'form' | 'success'>('details');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!job) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Collecting form data from inputs by ID since we aren't using controlled state for brevity
            // In a larger app, use React Hook Form or state
            const target = e.target as typeof e.target & {
                name: { value: string };
                email: { value: string };
                linkedin: { value: string };
                reason: { value: string };
            };

            const response = await fetch('/api/apply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jobRole: job.role,
                    name: (document.getElementById('name') as HTMLInputElement).value,
                    email: (document.getElementById('email') as HTMLInputElement).value,
                    linkedin: (document.getElementById('linkedin') as HTMLInputElement).value,
                    reason: (document.getElementById('reason') as HTMLTextAreaElement).value,
                }),
            });

            if (response.ok) {
                setStep('success');
            } else {
                alert("Ocorreu um erro ao enviar. Tente novamente.");
            }
        } catch (error) {
            console.error(error);
            alert("Ocorreu um erro ao enviar. Tente novamente.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setStep('details');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">

                {/* SUCCESS STATE */}
                {step === 'success' && (
                    <div className="flex flex-col items-center text-center py-10 space-y-4">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <DialogTitle className="text-2xl font-bold text-slate-900">Aplicação Enviada!</DialogTitle>
                        <DialogDescription className="text-lg text-slate-600 max-w-sm">
                            Recebemos seus dados para a vaga de <strong>{job.role}</strong>.
                            Nosso time de Talent Acquisition entrará em contato em breve.
                        </DialogDescription>
                        <Button onClick={handleClose} className="mt-6 bg-slate-900 text-white font-bold px-8">
                            Entendi, torça por mim!
                        </Button>
                    </div>
                )}

                {/* DETAILS STATE */}
                {step === 'details' && (
                    <>
                        <DialogHeader>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                    {job.dept}
                                </span>
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                    {job.loc}
                                </span>
                            </div>
                            <DialogTitle className="text-2xl font-bold text-slate-900">{job.role}</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                            <div className="prose prose-sm text-slate-600">
                                <p className="text-lg leading-relaxed border-l-4 border-iuppy-orange pl-4 italic bg-orange-50/50 p-4 rounded-r-lg">
                                    "{job.desc}"
                                </p>

                                <h4 className="font-bold text-slate-900 mt-6 mb-2">O que esperamos de você</h4>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li>Paixão por resolver problemas reais de comunicação.</li>
                                    <li>Mindset de "dono" (Ownership).</li>
                                    <li>Capacidade de trabalhar com autonomia em ambiente remoto.</li>
                                    {job.hrTech && <li>Experiência prévia em HR Tech ou SaaS B2B é um grande diferencial.</li>}
                                    {job.highlight && <li className="font-bold text-green-700">{job.highlight}</li>}
                                </ul>

                                <h4 className="font-bold text-slate-900 mt-6 mb-2">Nossos Benefícios</h4>
                                <ul className="grid grid-cols-2 gap-2 text-xs">
                                    <li>✅ Salário Competitivo</li>
                                    <li>✅ Bônus por Performance</li>
                                    <li>✅ Full Remote (ou Híbrido)</li>
                                    <li>✅ Plano de Saúde Top Tier</li>
                                    <li>✅ Auxílio Home Office</li>
                                    <li>✅ Gympass</li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <Button variant="outline" onClick={handleClose}>Cancelar</Button>
                            <Button onClick={() => setStep('form')} className="bg-iuppy-orange hover:bg-orange-600 text-white font-bold">
                                Aplicar para esta vaga
                            </Button>
                        </div>
                    </>
                )}

                {/* FORM STATE */}
                {step === 'form' && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Aplicar para: {job.role}</DialogTitle>
                            <DialogDescription>
                                Preencha seus dados. Prometemos ler com carinho.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome Completo</Label>
                                    <Input id="name" required placeholder="Seu nome" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">E-mail</Label>
                                    <Input id="email" type="email" required placeholder="seu@email.com" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="linkedin">LinkedIn (URL)</Label>
                                <Input id="linkedin" required placeholder="linkedin.com/in/seu-perfil" />
                            </div>

                            <div className="space-y-2">
                                <Label>Currículo (CV)</Label>
                                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer group">
                                    <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-iuppy-orange mb-2 transition-colors" />
                                    <span className="text-sm font-medium text-slate-600">
                                        Clique para fazer upload ou arraste seu PDF aqui
                                    </span>
                                    <span className="text-xs text-slate-400 mt-1">Máx. 5MB (PDF)</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reason">Por que a Iuppy?</Label>
                                <Textarea id="reason" placeholder="Conte brevemente por que você quer fazer parte do nosso time..." className="h-24" />
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                                <Button type="button" variant="ghost" onClick={() => setStep('details')} className="text-slate-500">
                                    &larr; Voltar
                                </Button>
                                <Button type="submit" disabled={isSubmitting} className="bg-iuppy-blue hover:bg-blue-700 text-white font-bold min-w-[140px]">
                                    {isSubmitting ? "Enviando..." : "Enviar Aplicação"}
                                </Button>
                            </div>
                        </form>
                    </>
                )}

            </DialogContent>
        </Dialog>
    );
}
