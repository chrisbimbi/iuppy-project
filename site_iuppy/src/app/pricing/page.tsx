"use client";

import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Check, CheckCircle2, Minus, X, MessageSquare, Zap, Calculator } from "lucide-react";
import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export default function PricingPage() {
    return (
        <div className="bg-slate-50 min-h-screen">
            {/* Hero */}
            <Section className="pt-32 pb-12 text-center">
                <div className="max-w-3xl mx-auto space-y-6">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight">
                        Escolha o tamanho da sua <br />
                        <span className="text-iuppy-blue">revolução interna</span>.
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                        Do essencial para manter todos informados, à inteligência artificial que prevê o turnover.
                        Na Iuppy, você nunca paga pelo que não usa.
                    </p>
                </div>
            </Section>

            {/* Pricing Cards */}
            <Section className="pb-24">
                <div className="container-custom max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-8 items-stretch">

                        {/* Plan 1: Conecta */}
                        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 flex flex-col relative overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-1">
                            <div className="mb-6">
                                <h3 className="text-3xl font-bold text-slate-900 mb-2">Plano Conecta</h3>
                                <div className="text-slate-500 font-medium">
                                    A base sólida para sua Comunicação Interna.
                                </div>
                            </div>

                            {/* Features Highlights */}
                            <div className="flex-1 space-y-6 mb-8">
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3">
                                        <div className="p-1 bg-green-100 rounded-full shrink-0"><Check className="w-4 h-4 text-green-600" /></div>
                                        <span className="text-slate-700 font-medium">App White-label (Android & iOS)</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="p-1 bg-green-100 rounded-full shrink-0"><Check className="w-4 h-4 text-green-600" /></div>
                                        <span className="text-slate-700 font-medium">Comunicados e Notícias</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="p-1 bg-green-100 rounded-full shrink-0"><Check className="w-4 h-4 text-green-600" /></div>
                                        <span className="text-slate-700 font-medium">Mural Social Interativo</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="p-1 bg-green-100 rounded-full shrink-0"><Check className="w-4 h-4 text-green-600" /></div>
                                        <span className="text-slate-700 font-medium">Criador de Formulários</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="p-1 bg-green-100 rounded-full shrink-0"><Check className="w-4 h-4 text-green-600" /></div>
                                        <span className="text-slate-700 font-medium">Enquetes Rápidas</span>
                                    </li>
                                </ul>

                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-600">
                                    <p className="font-bold text-slate-900 mb-1">Flexibilidade Total:</p>
                                    Adicione módulos de RH (Holerite, Férias, etc) pagando apenas uma pequena taxa extra por módulo ativo.
                                </div>
                            </div>

                            <Link href="https://wa.me/5511983264559?text=Ol%C3%A1%2C%20gostaria%20de%20saber%20mais%20sobre%20o%20Plano%20Conecta%20da%20Iuppy." target="_blank" className="block mt-auto">
                                <Button variant="outline" className="w-full h-14 text-lg font-bold border-2 border-iuppy-blue text-iuppy-blue hover:bg-blue-50">
                                    Falar com Consultor
                                </Button>
                            </Link>
                        </div>

                        {/* Plan 2: Ilimitado */}
                        <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 p-8 flex flex-col relative overflow-hidden transform md:-translate-y-2">
                            <div className="absolute top-0 right-0 bg-iuppy-orange text-white text-xs font-bold px-4 py-1 rounded-bl-xl uppercase tracking-wider">
                                Melhor Experiência
                            </div>

                            <div className="mb-6">
                                <h3 className="text-3xl font-bold text-white mb-2">Plano Ilimitado</h3>
                                <div className="text-slate-400 font-medium">
                                    A suíte definitiva de Employee Experience.
                                </div>
                            </div>

                            {/* Features Highlights */}
                            <div className="flex-1 space-y-6 mb-8">
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3">
                                        <div className="p-1 bg-iuppy-blue rounded-full shrink-0"><Check className="w-4 h-4 text-white" /></div>
                                        <span className="text-white font-bold">Tudo do Plano Conecta</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="p-1 bg-iuppy-blue rounded-full shrink-0"><Check className="w-4 h-4 text-white" /></div>
                                        <span className="text-slate-200 font-medium">Todos os Módulos de RH (Holerite, Férias)</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="p-1 bg-iuppy-blue rounded-full shrink-0"><Check className="w-4 h-4 text-white" /></div>
                                        <span className="text-slate-200 font-medium">Automação de Processos</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="p-1 bg-iuppy-blue rounded-full shrink-0"><Check className="w-4 h-4 text-white" /></div>
                                        <span className="text-slate-200 font-medium">Lead Scoring de Retenção (AI)</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="p-1 bg-iuppy-blue rounded-full shrink-0"><Check className="w-4 h-4 text-white" /></div>
                                        <span className="text-slate-200 font-medium">Integrações Nativas</span>
                                    </li>
                                </ul>

                                <div className="p-4 bg-white/10 rounded-xl border border-white/5 text-sm text-blue-100">
                                    <p className="font-bold text-white mb-1">Acesso Vitalício às Novidades:</p>
                                    Todo novo módulo que a Iuppy lançar no futuro será adicionado à sua conta automaticamente, sem custo extra. **Para Sempre.**
                                </div>
                            </div>

                            <Link href="https://wa.me/5511983264559?text=Ol%C3%A1%2C%20gostaria%20de%20um%20or%C3%A7amento%20para%20o%20Plano%20Ilimitado%20da%20Iuppy." target="_blank" className="block mt-auto">
                                <Button className="w-full h-14 text-lg font-bold bg-iuppy-blue hover:bg-blue-600 shadow-xl shadow-blue-900/50 text-white border-0">
                                    Solicitar Orçamento <Zap className="w-4 h-4 ml-2 fill-current" />
                                </Button>
                            </Link>
                        </div>

                    </div>
                </div>
            </Section>

            {/* Compararison Table */}
            <Section className="py-24 bg-white border-t border-slate-100">
                <div className="container-custom max-w-5xl">
                    <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Comparativo Detalhado</h2>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="text-left py-4 px-6 text-slate-500 font-medium w-1/3">Funcionalidade</th>
                                    <th className="text-center py-4 px-6 text-slate-900 font-bold text-xl w-1/3 bg-slate-50 rounded-t-xl">Plano Conecta</th>
                                    <th className="text-center py-4 px-6 text-white font-bold text-xl w-1/3 bg-slate-900 rounded-t-xl relative overflow-hidden">
                                        Plano Ilimitado
                                        <div className="absolute top-0 right-0 w-8 h-8 bg-iuppy-orange rounded-bl-full"></div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <TableRow label="App Personalizado (White-label)" conecta={true} ilimitado={true} />
                                <TableRow label="Dashboard Administrativo" conecta={true} ilimitado={true} />
                                <TableRow label="Feed de Notícias & Segmentação" conecta={true} ilimitado={true} />
                                <TableRow label="Mural Social (Estilo LinkedIn)" conecta={true} ilimitado={true} />
                                <TableRow label="Enquetes & Pesquisas" conecta={true} ilimitado={true} />
                                <TableRow label="Formulários Dinâmicos" conecta={true} ilimitado={true} />
                                <TableRow label="Base de Conhecimento / Wiki" conecta={true} ilimitado={true} />

                                <TableRowSpacer label="Módulos de RH" />
                                <TableRow label="Holerite Digital" conecta="Opcional (Extra)" ilimitado={true} />
                                <TableRow label="Informe de Rendimentos" conecta="Opcional (Extra)" ilimitado={true} />
                                <TableRow label="Solicitação de Férias" conecta="Opcional (Extra)" ilimitado={true} />
                                <TableRow label="Banco de Horas" conecta="Opcional (Extra)" ilimitado={true} />
                                <TableRow label="Ouvidoria & Compliance" conecta="Opcional (Extra)" ilimitado={true} />

                                <TableRowSpacer label="Inteligência & Integração" />
                                <TableRow label="Automação de Fluxos" conecta={false} ilimitado={true} />
                                <TableRow label="Lead Scoring (Risco de Saída)" conecta={false} ilimitado={true} />
                                <TableRow label="Chatbot AI" conecta={false} ilimitado={true} />
                                <TableRow label="Integração (SAP, ADP, Totvs...)" conecta="Opcional (Extra)" ilimitado={true} />
                                <TableRow label="Suporte via WhatsApp" conecta={false} ilimitado={true} />
                                <TableRow label="Gerente de Sucesso (CS)" conecta={false} ilimitado={true} />
                                <TableRow label="Novos Módulos Futuros" conecta={false} ilimitado="Incluso" />
                            </tbody>
                        </table>
                    </div>
                </div>
            </Section>

            {/* FAQ */}
            <Section className="bg-slate-50 py-24">
                <div className="container-custom max-w-3xl">
                    <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Perguntas Frequentes</h2>

                    <Accordion type="single" collapsible className="w-full bg-white rounded-2xl shadow-sm px-6 py-2">
                        <AccordionItem value="item-1" className="border-b-0">
                            <AccordionTrigger>Como funciona a cobrança dos módulos extras no Plano Conecta?</AccordionTrigger>
                            <AccordionContent>
                                É simples. Você paga um valor base bem acessível pelo plano e adiciona "Add-ons" conforme sua necessidade. Por exemplo, se quiser ativar apenas o Holerite Digital, você paga uma pequena taxa adicional por vida/mês apenas para esse módulo.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2" className="border-b-0 border-t">
                            <AccordionTrigger>O Plano Ilimitado inclui mesmo tudo?</AccordionTrigger>
                            <AccordionContent>
                                Sim. Absolutamente todos os módulos que temos hoje e todos que desenvolveremos no futuro. É um compromisso da Iuppy de garantir que sua empresa esteja sempre na vanguarda da tecnologia de RH, sem ficar renegociando contratos a cada novidade.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3" className="border-b-0 border-t">
                            <AccordionTrigger>Temos suporte na implantação?</AccordionTrigger>
                            <AccordionContent>
                                Em todos os planos oferecemos suporte técnico. No Plano Ilimitado, você ganha também um Gerente de Sucesso do Cliente (CS), que ajudará a desenhar estratégias de engajamento e campanhas de lançamento.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </Section>

            {/* Final CTA */}
            <Section className="py-24 bg-iuppy-blue text-white text-center">
                <div className="container-custom max-w-4xl">
                    <h2 className="text-3xl md:text-5xl font-bold mb-8">
                        Pronto para modernizar seu RH?
                    </h2>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="https://wa.me/5511983264559" target="_blank">
                            <Button size="lg" variant="secondary" className="h-16 px-8 text-lg font-bold shadow-xl">
                                <MessageSquare className="mr-2 w-5 h-5" />
                                Falar com Especialista
                            </Button>
                        </Link>
                    </div>
                </div>
            </Section>
        </div>
    );
}

function TableRow({ label, conecta, ilimitado }: { label: string, conecta: boolean | string, ilimitado: boolean | string }) {
    const renderCell = (val: boolean | string, isDark = false) => {
        if (typeof val === "boolean") {
            return val ? (
                <div className="flex justify-center"><CheckCircle2 className={cn("w-6 h-6", isDark ? "text-green-400" : "text-green-500")} /></div>
            ) : (
                <div className="flex justify-center"><Minus className={cn("w-6 h-6", isDark ? "text-slate-600" : "text-slate-300")} /></div>
            );
        }
        return <span className={cn("text-sm font-bold", isDark ? "text-blue-200" : "text-slate-500")}>{val}</span>;
    };

    return (
        <tr className="hover:bg-slate-50/50 transition-colors">
            <td className="py-4 px-6 text-slate-700 font-medium border-b border-t border-slate-100">{label}</td>
            <td className="py-4 px-6 text-center border-l border-r border-slate-100 bg-slate-50/30">{renderCell(conecta)}</td>
            <td className="py-4 px-6 text-center bg-slate-900 border-l border-r border-slate-800">{renderCell(ilimitado, true)}</td>
        </tr>
    );
}

function TableRowSpacer({ label }: { label: string }) {
    return (
        <tr>
            <td colSpan={3} className="py-6 px-6 bg-slate-50 font-bold text-slate-400 uppercase tracking-widest text-xs border-y border-slate-100 mt-4">
                {label}
            </td>
        </tr>
    );
}
