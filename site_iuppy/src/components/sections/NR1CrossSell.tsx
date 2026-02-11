"use client";

import { AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Section } from "@/components/ui/section";

type IVariant = "hr" | "it" | "comms" | "industry" | "general" | "leaders" | "healthcare" | "retail" | "frontline";

interface NR1CrossSellProps {
    variant?: IVariant;
}

export function NR1CrossSell({ variant = "general" }: NR1CrossSellProps) {

    const content = {
        hr: {
            title: "Seu CPF está seguro, Diretor?",
            text: "A nova NR-1 responsabiliza solidariamente a liderança de RH por omissões na segurança. Não deixe seu passivo trabalhista virar criminal.",
            highlights: ["Risco de D&O não coberto", "Responsabilidade solidária", "Multas eSocial"]
        },
        it: {
            title: "Dados de Saúde e LGPD: O pesadelo da TI",
            text: "Armazenar ASOs, laudos e aceites de normas em servidores não auditáveis é um risco de vazamento. Centralize a segurança ocupacional com criptografia AES-256.",
            highlights: ["Compliance LGPD", "Segurança da Informação", "Auditoria de Acessos"]
        },
        comms: {
            title: "Comunicar Risco é Obrigação Legal",
            text: "Não basta enviar o comunicado de segurança. Você precisa provar que ele foi lido e compreendido. A CI agora é uma ferramenta de defesa jurídica.",
            highlights: ["Dever de Informar (NR-1.4)", "Rastreabilidade de Leitura", "Fim do 'Não Sabia'"]
        },
        industry: {
            title: "Reduza o FAP e Economize Milhões",
            text: "Acidentes de trabalho dobram sua tributação sobre a folha. O treinamento gamificado da Iuppy reduz incidentes e melhora seu multiplicador FAP.",
            highlights: ["Redução de Tributos", "Prevenção de Acidentes", "Cultura de Segurança"]
        },
        leaders: {
            title: "Blindagem Jurídica para a Alta Gestão",
            text: "Executivos C-Level são os primeiros alvos em processos criminais por acidentes graves. Garanta que sua empresa produz provas de diligência automaticamente.",
            highlights: ["Proteção de Patrimônio", "Governança Corporativa", "Mitigação de Riscos"]
        },
        healthcare: {
            title: "Biossegurança e Saúde Mental",
            text: "Hospitais enfrentam riscos duplos: biológicos e psicossociais (Burnout). Gerencie ambos em uma única plataforma auditável.",
            highlights: ["Normas de Biossegurança", "Prevenção ao Burnout", "Auditoria Hospitalar"]
        },
        retail: {
            title: "Treinamento Descentralizado em Escala",
            text: "Como garantir que 1.000 lojas cumpram a NR-1 sem deslocar instrutores? Digitalize o onboarding de segurança e monitore cada unidade em tempo real.",
            highlights: ["Capilaridade", "Padronização", "Redução de Custo de Viagem"]
        },
        frontline: {
            title: "Segurança na Palma da Mão do Operador",
            text: "Leve a cultura de segurança para quem está na linha de frente. Sem e-mail corporativo? Sem problemas. Acesso simples via App ou Quiosque.",
            highlights: ["Acesso Mobile", "Linguagem Acessível", "Engajamento Real"]
        },
        general: {
            title: "Atualização Crítica: Nova NR-1",
            text: "Desde Maio de 2025, a gestão de riscos ocupacionais mudou radicalmente. Descubra como proteger sua empresa e sua liderança.",
            highlights: ["Conformidade 2026", "Digitalização de Processos", "Proteção Jurídica"]
        }
    };

    const current = content[variant];

    return (
        <Section className="py-16 bg-red-50 border-y border-red-100">
            <div className="container-custom">
                <div className="flex flex-col lg:flex-row items-center gap-10 bg-white p-8 rounded-2xl border border-red-100 shadow-sm">
                    <div className="flex-shrink-0 bg-red-100 p-4 rounded-full animate-pulse">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>

                    <div className="flex-1">
                        <div className="text-red-600 font-bold uppercase text-xs tracking-wider mb-2">
                            Atenção: Compliance Trabalhista
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-3">
                            {current.title}
                        </h3>
                        <p className="text-slate-600 mb-4 leading-relaxed">
                            {current.text}
                        </p>
                        <ul className="flex flex-wrap gap-4 text-sm font-medium text-slate-700">
                            {current.highlights.map((item, i) => (
                                <li key={i} className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex-shrink-0">
                        <Link href="/solutions/nr1">
                            <Button className="bg-red-600 hover:bg-red-700 text-white font-bold h-12 px-8 shadow-lg shadow-red-200">
                                Ver Impacto na NR-1 <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </Section>
    );
}
