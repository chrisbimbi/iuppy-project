import { Section } from "@/components/ui/section";
import { Layers, Megaphone, ZapOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function HomeProblems() {
    const problems = [
        {
            title: "O Silo de Comunicação",
            desc: "Pagar por múltiplas ferramentas que não se falam, deixando atualizações importantes perdidas e times dessincronizados.",
            icon: Layers,
            imageColor: "bg-orange-100",
            iconColor: "text-orange-600",
            href: "/platform#integrations"
        },
        {
            title: "A Máquina de Ruído",
            desc: "Bombardear colaboradores com informações irrelevantes faz com que notícias críticas sejam ignoradas. Isso não é comunicação; é confusão.",
            icon: Megaphone,
            imageColor: "bg-red-100",
            iconColor: "text-red-600",
            href: "/platform#email"
        },
        {
            title: "O Gap da Linha de Frente",
            desc: "Falhar em alcançar quem não tem mesa ou computador. Se você não consegue conectar 100% da sua força de trabalho, você não consegue liderar.",
            icon: ZapOff,
            imageColor: "bg-slate-200",
            iconColor: "text-slate-600",
            href: "/solutions/frontline"
        }
    ];

    return (
        <Section className="py-24 bg-white">
            <div className="container-custom">
                <h2 className="text-4xl font-bold text-slate-900 mb-16 text-center md:text-left">
                    O que está quebrando a experiência do colaborador hoje
                </h2>

                <div className="grid md:grid-cols-3 gap-8">
                    {problems.map((p, i) => (
                        <div key={i} className="group rounded-2xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300 bg-white">
                            {/* Visual "Image" Placeholder */}
                            <div className={`h-48 ${p.imageColor} flex items-center justify-center relative overflow-hidden`}>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                                <p.icon className={`w-20 h-20 ${p.iconColor} opacity-20 transform group-hover:scale-110 transition-transform duration-500`} />
                                <p.icon className={`w-12 h-12 ${p.iconColor} absolute z-10`} />
                            </div>

                            <div className="p-8 space-y-4">
                                <h3 className="text-2xl font-bold text-slate-900">{p.title}</h3>
                                <p className="text-slate-600 leading-relaxed text-sm">
                                    {p.desc}
                                </p>
                                <div className="pt-4">
                                    <Link href={p.href}>
                                        <Button variant="ghost" className="p-0 h-auto font-bold text-iuppy-blue hover:bg-transparent hover:underline group-hover:translate-x-1 transition-transform">
                                            Ver a solução <ArrowRight className="ml-2 w-4 h-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Section>
    );
}
