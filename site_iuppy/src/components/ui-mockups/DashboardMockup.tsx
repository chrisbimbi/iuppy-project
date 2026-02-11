"use client";

import { motion } from "framer-motion";
import { BarChart3, Users, Settings, Bell, Search, LayoutDashboard, FileText, Trophy, TrendingUp, Calendar, AlertCircle } from "lucide-react";

export function DashboardMockup() {
    return (
        <div className="w-full max-w-5xl mx-auto bg-gray-50 rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex font-sans text-sm">

            {/* Sidebar (Dark Mode style from CMS) */}
            <div className="w-64 bg-[#1e1e2d] text-[#9899ac] flex-shrink-0 flex flex-col hidden md:flex">
                <div className="h-16 flex items-center px-6">
                    <span className="text-white font-bold text-xl tracking-tight">iuppy</span>
                </div>

                <div className="flex-1 px-4 py-6 space-y-1">
                    <div className="flex items-center gap-3 bg-[#1b1b29] text-white px-3 py-3 rounded-lg font-medium cursor-pointer">
                        <LayoutDashboard className="w-4 h-4 text-primary" />
                        <span>Dashboards</span>
                    </div>
                    <div className="flex items-center gap-3 hover:text-white hover:bg-[#1b1b29] px-3 py-2 rounded-lg transition-colors cursor-pointer text-sm">
                        <Bell className="w-3.5 h-3.5" />
                        <span>Comunicados</span>
                    </div>
                    <div className="flex items-center gap-3 hover:text-white hover:bg-[#1b1b29] px-3 py-2 rounded-lg transition-colors cursor-pointer text-sm">
                        <Settings className="w-3.5 h-3.5" />
                        <span>Enquetes</span>
                    </div>
                    <div className="flex items-center gap-3 hover:text-white hover:bg-[#1b1b29] px-3 py-2 rounded-lg transition-colors cursor-pointer text-sm">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Formulários</span>
                    </div>
                    <div className="flex items-center gap-3 hover:text-white hover:bg-[#1b1b29] px-3 py-2 rounded-lg transition-colors cursor-pointer text-sm">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Jornadas</span>
                    </div>
                    <div className="flex items-center gap-3 hover:text-white hover:bg-[#1b1b29] px-3 py-2 rounded-lg transition-colors cursor-pointer text-sm">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Gestão de Férias</span>
                    </div>
                    <div className="flex items-center gap-3 hover:text-white hover:bg-[#1b1b29] px-3 py-2 rounded-lg transition-colors cursor-pointer text-sm">
                        <Trophy className="w-3.5 h-3.5" />
                        <span>Desempenho</span>
                    </div>
                    <div className="flex items-center gap-3 hover:text-white hover:bg-[#1b1b29] px-3 py-2 rounded-lg transition-colors cursor-pointer text-sm">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>NR-1</span>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-[600px] overflow-hidden">
                {/* Topbar */}
                <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-10">
                    <h2 className="font-bold text-gray-800 text-lg">Visão Geral</h2>
                    <div className="flex items-center gap-4">
                        <div className="bg-gray-100 p-2 rounded-lg text-gray-400">
                            <Search className="w-4 h-4" />
                        </div>
                        <div className="relative">
                            <Bell className="w-5 h-5 text-gray-400" />
                            <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                        </div>
                        <div className="w-9 h-9 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                            C
                        </div>
                    </div>
                </div>

                {/* Content Scrollable */}
                <div className="flex-1 overflow-auto p-8 bg-[#f5f8fa]">
                    <div className="grid grid-cols-12 gap-8">

                        {/* Widget: Stats (MixedWidget2 equivalent) */}
                        <div className="col-span-12 lg:col-span-4 bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative overflow-hidden">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-3xl font-bold text-gray-900">280</h3>
                                    <p className="text-gray-500 font-medium mt-1">Colaboradores Totais</p>
                                </div>
                                <span className="bg-green-50 text-green-600 px-2 py-1 rounded text-xs font-bold">+12%</span>
                            </div>
                            {/* Mini Chart Visualization */}
                            <div className="flex items-end gap-2 h-24 mt-4">
                                {[40, 60, 45, 80, 55, 90, 75].map((h, i) => (
                                    <div key={i} className="flex-1 bg-blue-50 rounded-sm relative group">
                                        <motion.div
                                            initial={{ height: 0 }}
                                            whileInView={{ height: `${h}%` }}
                                            transition={{ delay: i * 0.1 }}
                                            className="absolute bottom-0 w-full bg-iuppy-blue rounded-sm group-hover:bg-iuppy-orange transition-colors"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Widget: Engagement (TablesWidget10 equivalent) */}
                        <div className="col-span-12 lg:col-span-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-gray-800">Engajamento de Conteúdo</h3>
                                <button className="text-xs font-bold text-gray-400 hover:text-iuppy-blue">VER TODOS</button>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { title: "Nova Política de Home Office", views: 245, likes: 120, comments: 45, color: "bg-blue-100 text-blue-600" },
                                    { title: "Resultado Q1 - Metas Batidas!", views: 278, likes: 156, comments: 89, color: "bg-green-100 text-green-600" },
                                    { title: "Bem-vindo aos novos Iuppers", views: 190, likes: 80, comments: 32, color: "bg-purple-100 text-purple-600" }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                        <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center font-bold shrink-0`}>
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-800 text-sm">{item.title}</h4>
                                            <p className="text-xs text-gray-400">Publicado há 2 dias</p>
                                        </div>
                                        <div className="flex items-center gap-6 text-sm text-gray-600">
                                            <span className="font-bold">{item.views} <span className="text-gray-400 font-normal ml-1">visto</span></span>
                                            <span className="font-bold">{item.likes} <span className="text-gray-400 font-normal ml-1">curtiram</span></span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Widget: Gamification Leaderboard */}
                        <div className="col-span-12 lg:col-span-4 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <Trophy className="w-5 h-5 text-yellow-500" />
                                <h3 className="font-bold text-gray-800">Ranking Geral</h3>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { name: "Ana Silva", points: 1250, avatar: "bg-red-100 text-red-600", emoji: "🥇" },
                                    { name: "Carlos Souza", points: 980, avatar: "bg-blue-100 text-blue-600", emoji: "🥈" },
                                    { name: "Beatriz Lima", points: 875, avatar: "bg-green-100 text-green-600", emoji: "🥉" },
                                ].map((user, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">{user.emoji}</span>
                                            <div className={`w-8 h-8 rounded-full ${user.avatar} flex items-center justify-center text-xs font-bold`}>
                                                {user.name.charAt(0)}
                                            </div>
                                            <span className="font-bold text-gray-700 text-sm">{user.name}</span>
                                        </div>
                                        <span className="text-sm font-bold text-iuppy-blue">{user.points} pts</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Widget: Pending Vacations (TablesWidget11 equivalent) */}
                        <div className="col-span-12 lg:col-span-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-gray-800">Férias Pendentes</h3>
                                <Calendar className="w-5 h-5 text-gray-400" />
                            </div>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-xs text-gray-400 border-b border-gray-100">
                                        <th className="py-2 font-medium uppercase">Colaborador</th>
                                        <th className="py-2 font-medium uppercase">Período</th>
                                        <th className="py-2 font-medium uppercase">Status</th>
                                        <th className="py-2 font-medium uppercase text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    <tr className="border-b border-gray-50 last:border-0">
                                        <td className="py-4 font-bold text-gray-700">João Mendes</td>
                                        <td className="py-4 text-gray-500">10 Ago - 25 Ago</td>
                                        <td className="py-4"><span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">Aprovação</span></td>
                                        <td className="py-4 text-right"><button className="text-iuppy-blue font-bold text-xs hover:underline">Revisar</button></td>
                                    </tr>
                                    <tr className="border-b border-gray-50 last:border-0">
                                        <td className="py-4 font-bold text-gray-700">Fernanda Torres</td>
                                        <td className="py-4 text-gray-500">01 Set - 15 Set</td>
                                        <td className="py-4"><span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">Aprovação</span></td>
                                        <td className="py-4 text-right"><button className="text-iuppy-blue font-bold text-xs hover:underline">Revisar</button></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
