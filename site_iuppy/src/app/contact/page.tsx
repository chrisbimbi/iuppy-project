"use client";

import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
    return (
        <div className="pt-24 min-h-screen bg-slate-50">
            <Section className="py-20">
                <div className="container-custom max-w-4xl bg-white p-12 rounded-2xl shadow-xl border border-gray-100">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-slate-900 mb-4">Fale com a gente</h1>
                        <p className="text-slate-500">
                            Tem dúvidas sobre a plataforma ou quer uma proposta personalizada? Preencha o formulário abaixo.
                        </p>
                    </div>

                    <form className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Nome Completo</label>
                            <input type="text" className="w-full border border-gray-200 rounded p-3 focus:outline-none focus:ring-2 focus:ring-iuppy-blue" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">E-mail Corporativo</label>
                            <input type="email" className="w-full border border-gray-200 rounded p-3 focus:outline-none focus:ring-2 focus:ring-iuppy-blue" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Empresa</label>
                            <input type="text" className="w-full border border-gray-200 rounded p-3 focus:outline-none focus:ring-2 focus:ring-iuppy-blue" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Telefone</label>
                            <input type="tel" className="w-full border border-gray-200 rounded p-3 focus:outline-none focus:ring-2 focus:ring-iuppy-blue" />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-bold text-gray-700">Como podemos ajudar?</label>
                            <textarea className="w-full border border-gray-200 rounded p-3 h-32 focus:outline-none focus:ring-2 focus:ring-iuppy-blue" />
                        </div>
                        <div className="md:col-span-2">
                            <Button className="w-full h-12 text-lg font-bold bg-iuppy-blue hover:bg-iuppy-blue/90">
                                Enviar Mensagem
                            </Button>
                        </div>
                    </form>
                </div>
            </Section>
        </div>
    );
}
