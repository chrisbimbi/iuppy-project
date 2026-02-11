"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, ArrowRight, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

import { DemoModal } from "@/components/conversion/DemoModal";

import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { ListItem } from "../ui/list-item";

export function Navbar() {
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isDemoOpen, setDemoOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);

        // Listen for custom event from Blog posts
        const handleOpenModal = () => setDemoOpen(true);
        window.addEventListener('open-demo-modal', handleOpenModal);

        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener('open-demo-modal', handleOpenModal);
        }
    }, []);

    if (pathname === "/thank-you") {
        return null;
    }

    return (
        <nav
            className={cn(
                "fixed top-4 left-0 right-0 z-[100] transition-all duration-300 mx-auto max-w-[95%] md:max-w-7xl rounded-full",
                "bg-white shadow-lg border border-slate-100 py-2 sm:py-3"
            )}
        >
            <div className="container-custom flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="relative z-50 flex items-center gap-2 group">
                    <img
                        src="/assets/logo_iuppy.png"
                        alt="iuppy!"
                        className="h-10 w-auto group-hover:scale-105 transition-transform duration-300"
                    />
                </Link>

                {/* Desktop Menu */}
                <div className="hidden lg:flex items-center gap-8">
                    <NavigationMenu>
                        <NavigationMenuList>

                            {/* Plataforma */}
                            <NavigationMenuItem>
                                <NavigationMenuTrigger className={cn("bg-transparent", !scrolled && "text-slate-800 hover:text-slate-900")}>Plataforma</NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                                        <li className="row-span-3">
                                            <NavigationMenuLink asChild>
                                                <a
                                                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-iuppy-blue relative overflow-hidden p-6 no-underline outline-none focus:shadow-md group"
                                                    href="/platform"
                                                >
                                                    {/* Background Image */}
                                                    <div className="absolute inset-0 z-0">
                                                        <img
                                                            src="/assets/worker.png"
                                                            alt="Colaborador utilizando app"
                                                            className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-500"
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-iuppy-blue via-iuppy-blue/80 to-transparent mix-blend-multiply" />
                                                    </div>

                                                    <div className="relative z-10">
                                                        <div className="mb-2 mt-4 text-lg font-bold text-white">
                                                            App do Colaborador
                                                        </div>
                                                        <p className="text-sm leading-tight text-blue-100 font-medium">
                                                            Conecte 100% da sua força de trabalho, do escritório ao time operacional.
                                                        </p>
                                                    </div>
                                                </a>
                                            </NavigationMenuLink>
                                        </li>
                                        <ListItem href="/platform#intranet" title="Intranet Social">
                                            O hub central de notícias e documentos da sua empresa.
                                        </ListItem>
                                        <ListItem href="/platform#analytics" title="Analytics Real">
                                            Métricas de leitura e engajamento em tempo real.
                                        </ListItem>
                                        <ListItem href="/platform#integrations" title="Integrações">
                                            Conecte com SAP, Totvs, ADP e Microsoft 365.
                                        </ListItem>
                                    </ul>
                                </NavigationMenuContent>
                            </NavigationMenuItem>

                            {/* Soluções */}
                            <NavigationMenuItem>
                                <NavigationMenuTrigger className={cn("bg-transparent", !scrolled && "text-slate-800 hover:text-slate-900")}>Soluções</NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <ul className="grid w-[400px] gap-3 p-4 md:w-[600px] md:grid-cols-2 lg:w-[700px]">
                                        <div className="space-y-3">
                                            <h4 className="font-bold text-sm text-slate-900 mb-2 px-2">Por Função</h4>
                                            <ListItem href="/solutions/comms" title="Comunicação Interna">
                                                Modernize mural e e-mail.
                                            </ListItem>
                                            <ListItem href="/solutions/hr" title="Recursos Humanos">
                                                Do operacional ao estratégico.
                                            </ListItem>
                                            <ListItem href="/solutions/it" title="Tecnologia (TI)">
                                                Segurança e automação.
                                            </ListItem>
                                            <ListItem href="/solutions/leaders" title="Liderança">
                                                Alinhamento executivo.
                                            </ListItem>
                                        </div>
                                        <div className="space-y-3">
                                            <h4 className="font-bold text-sm text-slate-900 mb-2 px-2">Por Indústria</h4>
                                            <ListItem href="/solutions/nr1" title="Time Operacional (NR-1)">
                                                Conformidade e segurança.
                                            </ListItem>
                                            <ListItem href="/solutions/manufacturing" title="Indústria">
                                                Conecte a operação.
                                            </ListItem>
                                            <ListItem href="/solutions/healthcare" title="Saúde">
                                                Hospitais e clínicas.
                                            </ListItem>
                                            <ListItem href="/solutions/retail" title="Varejo">
                                                Lojas e franquias.
                                            </ListItem>
                                        </div>
                                    </ul>
                                </NavigationMenuContent>
                            </NavigationMenuItem>

                            {/* Recursos */}
                            <NavigationMenuItem>
                                <NavigationMenuTrigger className={cn("bg-transparent", !scrolled && "text-slate-800 hover:text-slate-900")}>Recursos</NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                                        <ListItem href="/resources/blog" title="Blog Iuppy">
                                            Conteúdos profundos sobre o futuro do RH.
                                        </ListItem>


                                        <ListItem href="/contact" title="Central de Ajuda">
                                            Tutoriais e documentação técnica.
                                        </ListItem>
                                    </ul>
                                </NavigationMenuContent>
                            </NavigationMenuItem>

                            {/* Nossa Empresa */}
                            <NavigationMenuItem>
                                <NavigationMenuTrigger className={cn("bg-transparent", !scrolled && "text-slate-800 hover:text-slate-900")}>Nossa Empresa</NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                                        <ListItem href="/about" title="Sobre a Iuppy">
                                            Conheça nossa missão e valores.
                                        </ListItem>
                                        <ListItem href="/careers" title="Carreiras">
                                            Venha fazer parte do time.
                                        </ListItem>
                                        <ListItem href="/press" title="Imprensa">
                                            Newsroom e Media Kit.
                                        </ListItem>
                                        <ListItem href="/partners" title="Parceiros">
                                            Seja um parceiro de negócios.
                                        </ListItem>
                                        <ListItem href="/contact" title="Fale Conosco">
                                            Entre em contato com nosso time.
                                        </ListItem>
                                    </ul>
                                </NavigationMenuContent>
                            </NavigationMenuItem>

                        </NavigationMenuList>
                    </NavigationMenu>
                </div>

                {/* Right Actions */}
                <div className="hidden lg:flex items-center gap-4">
                    <Link href="/pricing" className={cn("text-sm font-semibold hover:underline transition-colors", scrolled ? "text-slate-600" : "text-slate-800 hover:text-slate-900")}>
                        Planos
                    </Link>

                    <Button onClick={() => setDemoOpen(true)} className={cn("font-bold shadow-lg transition-all", scrolled ? "bg-iuppy-orange text-white" : "bg-iuppy-orange text-white hover:bg-orange-600")}>
                        Agendar Demo
                    </Button>
                </div>

                {/* Mobile Trigger */}
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden relative z-50 text-slate-800">
                    {mobileMenuOpen ? <X /> : <Menu />}
                </button>

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, x: "100%" }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-0 bg-white z-40 pt-24 px-6 overflow-y-auto"
                        >
                            <div className="flex flex-col gap-6">
                                <div className="space-y-4">
                                    <h3 className="font-bold text-lg border-b pb-2">Plataforma</h3>
                                    <Link href="/platform" onClick={() => setMobileMenuOpen(false)} className="block text-slate-600">App do Colaborador</Link>
                                    <Link href="/platform#intranet" onClick={() => setMobileMenuOpen(false)} className="block text-slate-600">Intranet Social</Link>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="font-bold text-lg border-b pb-2">Soluções</h3>
                                    <Link href="/solutions/comms" onClick={() => setMobileMenuOpen(false)} className="block text-slate-600">Comunicação Interna</Link>
                                    <Link href="/solutions/nr1" onClick={() => setMobileMenuOpen(false)} className="block text-slate-600">Compliance NR-1</Link>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="font-bold text-lg border-b pb-2">Recursos</h3>
                                    <Link href="/resources/blog" onClick={() => setMobileMenuOpen(false)} className="block text-slate-600">Blog</Link>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="font-bold text-lg border-b pb-2">Nossa Empresa</h3>
                                    <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="block text-slate-600">Sobre a Iuppy</Link>
                                    <Link href="/careers" onClick={() => setMobileMenuOpen(false)} className="block text-slate-600">Carreiras</Link>
                                    <Link href="/press" onClick={() => setMobileMenuOpen(false)} className="block text-slate-600">Imprensa</Link>
                                    <Link href="/partners" onClick={() => setMobileMenuOpen(false)} className="block text-slate-600">Parceiros</Link>
                                    <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="block text-slate-600">Contato</Link>
                                </div>
                                <div className="space-y-4">
                                    <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="block font-bold text-lg border-b pb-2 text-slate-900">Planos</Link>
                                </div>
                                <Button onClick={() => { setMobileMenuOpen(false); setDemoOpen(true); }} className="w-full h-12 text-lg mt-4 bg-iuppy-orange hover:bg-orange-600 shadow-xl shadow-orange-500/20">Agendar Demo</Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <DemoModal isOpen={isDemoOpen} onClose={() => setDemoOpen(false)} />

            </div>
        </nav>
    );
}
