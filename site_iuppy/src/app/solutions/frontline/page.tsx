"use client";

import { FeatureRow } from "@/components/ui/feature-row";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { QrCode, Smartphone, FileText, Lock, Users, Monitor } from "lucide-react";
import Link from "next/link";
import { PreFooterCTA } from "@/components/layout/PreFooterCTA";
import { NR1CrossSell } from "@/components/sections/NR1CrossSell";

export default function FrontlinePage() {
    return (
        <>
            {/* HERO SECTION */}
            <Section className="bg-slate-900 text-white pt-40 pb-24 border-b border-white/10 relative overflow-hidden">
                {/* Background Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-900/40 to-slate-900/40 opacity-60"></div>

                <div className="container-custom relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-12">
                        <div className="flex-1 space-y-8 text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-900/20 text-orange-400 text-sm font-bold tracking-wider mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <Users className="w-4 h-4" />
                                <span>TIME OPERACIONAL CONECTADO</span>
                            </div>

                            <h1 className="text-5xl lg:text-7xl font-extrabold text-white leading-tight tracking-tight">
                                Inclua quem <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-500">realmente constrói.</span>
                            </h1>

                            <p className="text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                                80% da força de trabalho global não tem e-mail.
                                Dê voz, autonomia e dignidade digital para seu time operacional com um app que eles amam usar.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                                <Link href="/pricing">
                                    <Button size="lg" className="h-14 px-8 text-lg font-bold bg-orange-500 text-slate-900 hover:bg-orange-400 shadow-xl">
                                        Conectar Operação Agora
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <div className="flex-1 relative">
                            <div className="relative z-10 animate-in fade-in zoom-in duration-1000 delay-200">
                                <img
                                    src="/assets/headers/frontline.png"
                                    alt="Frontline worker using app"
                                    className="w-full h-auto drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                            {/* Industrial Glow */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-orange-600/10 blur-[100px] -z-10 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </Section>

            {/* PAIN POINTS */}
            <div className="bg-white py-24">
                <div className="container-custom">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">
                            Sem E-mail? Sem Problema.
                        </h2>
                        <p className="text-slate-600 text-lg">
                            Esqueça a burocracia de criar contas de AD para milhares de funcionários. Simplifique o acesso e garanta a segurança.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                title: "Login via CPF/Matrícula",
                                icon: Lock,
                                desc: "Acesso simples e seguro usando dados que o colaborador já sabe de cor. Reset de senha autônomo via SMS."
                            },
                            {
                                title: "Primeiro Acesso via QR",
                                icon: QrCode,
                                desc: "Espalhe cartazes com QR Codes nos refeitórios e vestiários. O colaborador aponta, baixa e entra."
                            },
                            {
                                title: "Holerite na Mão",
                                icon: FileText,
                                desc: "O principal motivo de download do app. Use o Holerite Digital como isca para trazer todos para dentro da plataforma."
                            },
                        ].map((item, i) => (
                            <div key={i} className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:shadow-lg transition-all duration-300">
                                <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center shadow-md mb-6 text-white">
                                    <item.icon className="w-7 h-7" />
                                </div>
                                <h3 className="font-bold text-xl text-slate-900 mb-3">{item.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FEATURE DEEP DIVE: KIOSK MODE */}
            <FeatureRow
                title="Modo Quiosque (TV Corporativa)"
                description="O celular é proibido na linha de produção? Sem problemas. Transforme TVs e Tablets comuns em murais digitais interativos ou passivos."
                image={
                    <div className="bg-slate-800 h-80 rounded-xl p-2 flex items-center justify-center relative overflow-hidden shadow-2xl border-4 border-slate-700">
                        {/* Simulate TV Screen */}
                        <div className="w-full h-full bg-slate-900 relative rounded overflow-hidden">
                            <div className="absolute top-0 left-0 w-full bg-orange-600 h-10 flex items-center px-4 justify-between">
                                <span className="font-bold text-white tracking-wider">NOTÍCIAS DA PLANTA</span>
                                <span className="text-white text-sm">10:42 AM</span>
                            </div>
                            <div className="p-8 flex items-center h-full">
                                <div className="w-1/2 pr-4 border-r border-slate-700">
                                    <h3 className="text-2xl font-bold text-white mb-2">Meta de Produção Batida! 🚀</h3>
                                    <p className="text-slate-400">Parabéns ao Turno B pela eficiência recorde de 98% na linha de montagem ontem.</p>
                                </div>
                                <div className="w-1/2 pl-4 flex flex-col gap-3">
                                    <div className="bg-slate-800 p-3 rounded border-l-4 border-green-500">
                                        <div className="text-xs text-slate-400 uppercase">Cardápio Hoje</div>
                                        <div className="text-white font-bold">Feijoada Completa</div>
                                    </div>
                                    <div className="bg-slate-800 p-3 rounded border-l-4 border-yellow-500">
                                        <div className="text-xs text-slate-400 uppercase">Aniversariantes</div>
                                        <div className="text-white font-bold">Maria Silva (Logística)</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                }
                notes={[
                    "Rotação automática de conteúdo",
                    "Integração com PowerBI (dashboards)",
                    "Avisos de Emergência Full-screen"
                ]}
            />

            {/* FEATURE DEEP DIVE: DIGITAL INCLUSION */}
            <FeatureRow
                reversed
                title="Dignidade Digital"
                description="Pare de tratar o time operacional como cidadãos de segunda classe. Dê a eles as mesmas ferramentas modernas que o administrativo possui."
                image={
                    <div className="bg-white border border-gray-200 h-80 rounded-xl p-8 flex items-center justify-center relative overflow-hidden shadow-lg">
                        <div className="text-center relative z-10">
                            <Monitor className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <h4 className="font-bold text-slate-900 text-xl mb-2">Inclusão Real</h4>
                            <p className="text-slate-500 max-w-sm mx-auto">
                                "Antes eu só sabia das coisas quando via no mural, dias depois. Agora me sinto parte da empresa de verdade."
                            </p>
                            <div className="mt-4 flex items-center justify-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-slate-300"></div>
                                <div className="text-left">
                                    <div className="text-xs font-bold text-slate-900">João P.</div>
                                    <div className="text-[10px] text-slate-500">Operador Líder</div>
                                </div>
                            </div>
                        </div>
                    </div>
                }
                notes={[
                    "App Leve (roda em celulares antigos)",
                    "Consumo de dados otimizado",
                    "Interface intuitiva (sem treinamento necessário)"
                ]}
                gradient="from-slate-100 to-slate-200"
            />

            <NR1CrossSell variant="frontline" />
            <PreFooterCTA />
        </>
    );
}
