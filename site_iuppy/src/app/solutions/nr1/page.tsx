"use client";

import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ShieldAlert, Fingerprint, LineChart, Scale, Eye, Users, Lock, ChevronDown, Check } from "lucide-react";
import { PreFooterCTA } from "@/components/layout/PreFooterCTA";

export default function Nr1Page() {
    return (
        <>
            {/* 1. HERO SECTION: URGENCY & LIABILITY (Art. 13 CP) */}
            <Section className="bg-slate-950 pt-36 pb-24 relative overflow-hidden">
                {/* Alarm Light Effect */}
                <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-red-600/10 blur-[120px] rounded-full animate-pulse" />

                <div className="container-custom relative z-10 text-center max-w-5xl mx-auto">
                    <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-4 py-2 rounded-full text-red-500 font-bold uppercase tracking-wide mb-8">
                        <AlertTriangle className="w-5 h-5" /> Blindagem Jurídica Ativa
                    </div>

                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight mb-8">
                        Não gerencie papel. <br />
                        <span className="text-red-500">Gerencie Provas Judiciais.</span>
                    </h1>

                    <h2 className="text-xl md:text-2xl text-slate-300 leading-relaxed mb-10 max-w-4xl mx-auto">
                        A única plataforma que conecta a operação ao <strong>eSocial (S-2240)</strong> e transforma cada "Li e Aceito" em evidência com <strong>validade jurídica (SHA-256)</strong>.
                    </h2>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" className="h-16 px-10 text-xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-900/30">
                            Agendar Auditoria de Blindagem
                        </Button>
                    </div>

                    <p className="mt-6 text-slate-500 text-sm">
                        *Proteja o CPF da diretoria contra a responsabilidade do Art. 13 do Código Penal.
                    </p>
                </div>
            </Section>

            {/* 2. THE PROBLEM: "GESTÃO DE GAVETA" (Criminal Risk & eSocial) */}
            <Section className="bg-white py-24">
                <div className="container-custom">
                    <div className="max-w-3xl mx-auto text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                            Sua gestão de segurança é <br />
                            <span className="text-red-600">um risco silencioso?</span>
                        </h2>
                        <p className="text-lg text-slate-600 leading-relaxed">
                            O Juiz não quer saber se você criou o procedimento, ele quer saber se o operador recebeu.
                            Sem evidência digital de entrega e compreensão, sua empresa está indefesa contra ações regressivas do INSS e multas do eSocial.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-slate-50 p-8 rounded-2xl border-l-4 border-red-500 shadow-sm hover:shadow-md transition-shadow">
                            <h3 className="text-4xl font-black text-slate-900 mb-2">eSocial</h3>
                            <p className="font-bold text-red-600 mb-4">MULTAS AUTOMÁTICAS</p>
                            <p className="text-slate-600 text-sm">
                                A falta de transmissão correta dos eventos S-2240 e S-2220 gera passivos milionários retroativos.
                            </p>
                        </div>
                        <div className="bg-slate-50 p-8 rounded-2xl border-l-4 border-orange-500 shadow-sm hover:shadow-md transition-shadow">
                            <h3 className="text-4xl font-black text-slate-900 mb-2">Art. 13 CP</h3>
                            <p className="font-bold text-orange-600 mb-4">RESPONSABILIDADE CRIMINAL</p>
                            <p className="text-slate-600 text-sm">
                                Omissão em segurança não é mais apenas erro administrativo. É crime com imputação direta ao CPF dos gestores.
                            </p>
                        </div>
                        <div className="bg-slate-50 p-8 rounded-2xl border-l-4 border-slate-500 shadow-sm hover:shadow-md transition-shadow">
                            <h3 className="text-4xl font-black text-slate-900 mb-2">GAP 30%</h3>
                            <p className="font-bold text-slate-700 mb-4">PERDA DE EFICIÊNCIA</p>
                            <p className="text-slate-600 text-sm">
                                Gestão manual de EPIs e treinamentos consome 30% do tempo dos Técnicos de Segurança.
                            </p>
                        </div>
                    </div>
                </div>
            </Section>

            {/* 3. THE SOLUTION: IUPPY STRATEGIC PILLARS */}
            <Section className="bg-slate-50 py-24">
                <div className="container-custom">
                    <div className="text-center mb-16">
                        <span className="text-iuppy-blue font-bold tracking-widest uppercase text-sm">A BLINDAGEM COMPLETA</span>
                        <h2 className="text-4xl font-bold text-slate-900 mt-2">
                            Do chão de fábrica ao <br />
                            <span className="text-iuppy-blue">Servidor do Governo.</span>
                        </h2>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
                        <div className="order-2 lg:order-1">
                            <div className="space-y-8">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-iuppy-blue flex items-center justify-center flex-shrink-0">
                                        <Lock className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">Automação eSocial (S-2240)</h3>
                                        <p className="text-slate-600 leading-relaxed">
                                            Nossa API fala a língua do governo. Geramos e transmitimos os XMLs dos eventos de Fatores de Risco automaticamente.
                                            Elimine o erro humano na digitação. Iuppy conecta os laudos (LTCAT/PGR) direto ao portal eSocial.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                                        <Fingerprint className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">Cofre de Evidências SHA-256</h3>
                                        <p className="text-slate-600 leading-relaxed">
                                            Papel se perde, dados ficam. Cada entrega de EPI, cada leitura de procedimento e cada quiz realizado gera um registro imutável com hash seguro.
                                            Tenha a rastreabilidade forense necessária para qualquer defesa trabalhista.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="order-1 lg:order-2 bg-white p-8 rounded-3xl shadow-xl border border-slate-100 relative">
                            {/* Mockup Simulado de Log de Aceite */}
                            <div className="font-mono text-xs text-slate-400 mb-4 border-b pb-2">EVIDENCE_VAULT_ID: 98A7-HASH-SHA256</div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                        <span className="font-bold text-slate-700">Evento S-2240 (Risco Físico)</span>
                                    </div>
                                    <span className="text-green-700 font-bold text-sm">TRANSMITIDO</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-slate-400 block text-[10px] uppercase">Protocolo Gov</span>
                                        <span className="font-medium text-slate-700">1.2025.00045.991</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block text-[10px] uppercase">Integridade</span>
                                        <span className="font-medium text-slate-700 font-mono text-xs">af89...1b2c (Validado)</span>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute -bottom-6 -right-6 bg-slate-900 text-white px-6 py-4 rounded-xl shadow-lg">
                                <span className="block text-xs text-slate-400 mb-1">Status de Compliance</span>
                                <span className="font-bold flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> 100% Auditável</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-800 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-iuppy-orange/20 blur-[80px] rounded-full"></div>
                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold mb-6">Onipresença Operacional (App)</h3>
                                <div className="space-y-6">
                                    <p className="text-slate-300 leading-relaxed">
                                        Leve a gestão de segurança para o bolso do colaborador. Com o <strong>App Iuppy</strong>, o preenchimento de checklists, report de ocorrências e consulta a planos de emergência acontece em tempo real, mesmo offline.
                                    </p>
                                    <div className="flex items-center gap-4 pt-4">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-iuppy-orange">100%</div>
                                            <div className="text-xs text-slate-400">Digital</div>
                                        </div>
                                        <div className="w-px h-8 bg-slate-700"></div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-iuppy-orange">0</div>
                                            <div className="text-xs text-slate-400">Papel</div>
                                        </div>
                                        <div className="w-px h-8 bg-slate-700"></div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-iuppy-orange">24/7</div>
                                            <div className="text-xs text-slate-400">Disponibilidade</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-8">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-xl bg-orange-100 text-iuppy-orange flex items-center justify-center flex-shrink-0">
                                    <LineChart className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">Redução Ativa do FAP</h3>
                                    <p className="text-slate-600 leading-relaxed">
                                        Ao reduzir acidentes com gamificação e garantir a conformidade dos registros, impactamos diretamente o fator FAP, gerando economias tributárias reais na folha de pagamento.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">Gestão de Riscos Psicossociais</h3>
                                    <p className="text-slate-600 leading-relaxed">
                                        A NR-1 agora exige gestão de riscos como Burnout. Use nossos canais de escuta anônima para monitorar o clima e prevenir passivos invisíveis antes que virem processos.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Section>

            {/* 4. TRUST SIGNALS: QUEM JÁ BLINDOU SUA GESTÃO */}
            <Section className="bg-white py-24">
                <div className="container-custom text-center">
                    <h2 className="text-2xl text-slate-500 font-medium mb-12">Empresas que dormem tranquilas com a Iuppy:</h2>
                    {/* Placeholder para Logos - Usar divs cinzas por enquanto ou nomes de empresas se tiver */}
                    <div className="flex flex-wrap justify-center gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Simulação visual de logos */}
                        {["Indústria A", "Logística B", "Hospitais C", "Varejo D"].map((logo, i) => (
                            <div key={i} className="h-12 w-32 bg-slate-200 rounded animate-pulse flex items-center justify-center font-bold text-slate-400">
                                {logo}
                            </div>
                        ))}
                    </div>

                    <div className="mt-16 bg-blue-50 p-8 rounded-2xl max-w-4xl mx-auto border border-blue-100">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="flex-1 text-left">
                                <p className="text-lg text-slate-700 italic mb-4">
                                    "A integração automática com o eSocial foi um divisor de águas.
                                    O que levava dias de digitação agora acontece em segundos, com zero erro. Minha equipe foca em segurança, não em burocracia."
                                </p>
                                <div>
                                    <div className="font-bold text-slate-900">Ricardo M.</div>
                                    <div className="text-sm text-slate-500">Diretor de Operações, Logística Nacional</div>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="bg-white px-4 py-2 rounded shadow-sm border text-xs font-bold text-slate-600 flex items-center gap-2">
                                    <ShieldAlert className="w-4 h-4 text-green-500" /> ISO 27001
                                </div>
                                <div className="bg-white px-4 py-2 rounded shadow-sm border text-xs font-bold text-slate-600 flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-blue-500" /> AES-256
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Section>

            {/* 5. COMPARISON TABLE */}
            <Section className="bg-slate-900 text-white py-24">
                <div className="container-custom max-w-5xl">
                    <h2 className="text-3xl font-bold text-center mb-16">O Preço da Proteção vs. O Custo da Multa</h2>
                    <div className="grid md:grid-cols-3 gap-1 text-sm md:text-base">
                        {/* Headers */}
                        <div className="p-6"></div>
                        <div className="p-6 bg-slate-800/50 text-center font-bold text-lg rounded-t-xl md:rounded-tr-none text-slate-400">Gestão Manual</div>
                        <div className="p-6 bg-iuppy-blue text-center font-bold text-xl rounded-t-xl text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-yellow-400 text-black text-[10px] font-bold px-2 py-1">BLINDADO</div>
                        </div>

                        {/* Rows */}
                        {[
                            { label: "Transmissão eSocial (S-2240)", bad: "Manual (Risco de Erro Humano)", good: "Automática (XML via API)" },
                            { label: "Evidência Jurídica", bad: "Papel Assinado (Contestável)", good: "Hash SHA-256 (Auditável)" },
                            { label: "Riscos Psicossociais", bad: "Inexistente", good: "Monitoramento Contínuo" },
                            { label: "Entrega de EPIs", bad: "Planilha Desatualizada", good: "Confirmação Biométrica no App" },
                            { label: "Responsabilidade", bad: "Pessoal do Gestor (CPF)", good: "Mitigada por Sistema (Compliance)" },
                        ].map((row, i) => (
                            <>
                                <div className="p-6 bg-slate-800/30 flex items-center font-bold text-slate-300">{row.label}</div>
                                <div className="p-6 bg-slate-800/50 flex items-center justify-center text-center text-red-400">{row.bad}</div>
                                <div className={`p-6 bg-blue-900/50 flex items-center justify-center text-center text-green-400 font-bold border-x border-blue-500/30 ${i === 4 ? 'border-b rounded-b-xl' : ''}`}>
                                    {row.good}
                                </div>
                            </>
                        ))}
                    </div>
                </div>
            </Section>

            <PreFooterCTA
                title="Sua tranquilidade jurídica custa menos que uma multa leve."
                subtitle="Implementação em 2 semanas. Sem custo de Setup. Integração nativa."
                ctaText="Proteger minha Gestão Agora"
            />
        </>
    );
}
