"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl border border-gray-100">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-900 text-sm mb-6 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Voltar para o site
                    </Link>
                    <h1 className="text-3xl font-extrabold text-iuppy-blue tracking-tighter mb-2">iuppy</h1>
                    <p className="text-gray-500">Acesse sua conta corporativa</p>
                </div>

                <form className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">E-mail Corporativo</label>
                        <input
                            type="email"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-iuppy-blue focus:border-transparent transition-all"
                            placeholder="voce@empresa.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                        <input
                            type="password"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-iuppy-blue focus:border-transparent transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="rounded text-iuppy-blue focus:ring-iuppy-blue" />
                            <span className="text-gray-600">Lembrar-me</span>
                        </label>
                        <a href="#" className="text-iuppy-blue font-semibold hover:underline">Esqueceu a senha?</a>
                    </div>

                    <Button className="w-full h-12 text-lg bg-iuppy-blue hover:bg-iuppy-blue/90">
                        Entrar
                    </Button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">
                    Ainda não é cliente? <Link href="/#demo" className="text-iuppy-blue font-bold hover:underline">Agende uma demonstração</Link>
                </div>
            </div>
        </div>
    );
}
