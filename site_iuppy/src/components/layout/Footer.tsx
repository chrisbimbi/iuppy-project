"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Instagram, Linkedin, Youtube } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-slate-900 text-slate-300 pt-20 pb-10 border-t border-slate-800">
            <div className="container-custom">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-12 mb-16">

                    {/* Column 1: Product */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-white text-lg">Produto</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/platform" className="hover:text-iuppy-blue transition-colors">App do Colaborador</Link></li>
                            <li><Link href="/platform#intranet" className="hover:text-iuppy-blue transition-colors">Intranet Social</Link></li>
                            <li><Link href="/platform#email" className="hover:text-iuppy-blue transition-colors">Email Newsletters</Link></li>
                            <li><Link href="/platform#analytics" className="hover:text-iuppy-blue transition-colors">Analytics</Link></li>
                            <li><Link href="/platform#integrations" className="hover:text-iuppy-blue transition-colors">Integrações</Link></li>
                            <li><Link href="/platform#security" className="hover:text-iuppy-blue transition-colors">Segurança Enterprise</Link></li>
                        </ul>
                    </div>

                    {/* Column 2: Solutions */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-white text-lg">Soluções</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/solutions/comms" className="hover:text-iuppy-blue transition-colors">Comunicação Interna</Link></li>
                            <li><Link href="/solutions/hr-director" className="hover:text-iuppy-blue transition-colors">Recursos Humanos</Link></li>
                            <li><Link href="/solutions/it" className="hover:text-iuppy-blue transition-colors">TI & Segurança</Link></li>
                            <li><Link href="/solutions/frontline" className="hover:text-iuppy-blue transition-colors">Linha de Frente</Link></li>
                            <li><Link href="/solutions/nr1" className="hover:text-iuppy-blue transition-colors">Compliance NR-1</Link></li>
                        </ul>
                    </div>

                    {/* Column 3: Resources */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-white text-lg">Aprenda</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/resources/blog" className="hover:text-iuppy-blue transition-colors">Blog</Link></li>

                            <li><Link href="/resources/webinars" className="hover:text-iuppy-blue transition-colors">Webinars</Link></li>
                            <li><Link href="/resources/guides" className="hover:text-iuppy-blue transition-colors">Guias & E-books</Link></li>
                            <li><Link href="/resources/events" className="hover:text-iuppy-blue transition-colors">Eventos</Link></li>
                        </ul>
                    </div>

                    {/* Column 4: Company */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-white text-lg">Sobre a Iuppy</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/about" className="hover:text-iuppy-blue transition-colors">Nossa História</Link></li>
                            <li><Link href="/careers" className="hover:text-iuppy-blue transition-colors">Carreiras</Link></li>
                            <li><Link href="/partners" className="hover:text-iuppy-blue transition-colors">Parceiros</Link></li>
                            <li><Link href="/contact" className="hover:text-iuppy-blue transition-colors">Contato</Link></li>
                        </ul>
                    </div>

                    {/* Column 5: Newsletter */}
                    <div className="col-span-2 lg:col-span-1 space-y-4 bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                        <h4 className="font-bold text-white text-lg">Fique atualizado</h4>
                        <p className="text-xs text-slate-400">Receba as últimas tendências de CI e RH direto no seu e-mail.</p>
                        <div className="flex flex-col gap-2">
                            <input
                                type="email"
                                placeholder="seu@email.com"
                                className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-iuppy-blue text-white"
                            />
                            <Button size="sm" className="w-full bg-iuppy-blue hover:bg-iuppy-blue/90">Inscrever</Button>
                        </div>
                    </div>

                </div>

                <div className="pt-8 pb-4 border-t border-slate-800">
                    <div className="grid md:grid-cols-2 gap-8 text-xs text-slate-500 mb-8">
                        <div>
                            <strong className="text-white block mb-2">São Paulo</strong>
                            <p>Avenida Paulista, 1106, Sala 01, Andar 16</p>
                            <p>Bela Vista, São Paulo – SP</p>
                            <p>CEP 01310-914</p>
                        </div>
                        <div>
                            <strong className="text-white block mb-2">Indaiatuba</strong>
                            <p>Rua Bernardino de Campos, 601 - 3º andar</p>
                            <p>Centro, Indaiatuba – SP</p>
                            <p>CEP 13330-260</p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-800">
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <Link href="/" className="hover:opacity-80 transition-opacity">
                                <img src="/assets/logo_iuppy.png" alt="iuppy" className="h-8 w-auto brightness-0 invert" />
                            </Link>
                            <div className="text-center md:text-left">
                                <span className="text-xs text-slate-500 block">© 2026 Iuppy | Comunicação Inteligente. Todos os direitos reservados.</span>
                                <span className="text-[10px] text-slate-600">CNPJ: 60.803.492/0001-85</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <Link href="https://www.linkedin.com/company/iuppy-ci/" target="_blank" className="hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></Link>
                            <Link href="https://www.instagram.com/iuppy_ci/" target="_blank" className="hover:text-white transition-colors"><Instagram className="w-5 h-5" /></Link>
                            <Link href="#" className="hover:text-white transition-colors"><Youtube className="w-5 h-5" /></Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
