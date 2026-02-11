"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

interface FeatureRowProps {
    id?: string;
    title: string;
    description: string;
    image: React.ReactNode;
    reversed?: boolean;
    notes?: string[];
    gradient?: string;
}

export function FeatureRow({ id, title, description, image, reversed = false, notes = [], gradient = "from-blue-500 to-cyan-500" }: FeatureRowProps) {
    return (
        <section id={id} className="py-24 overflow-hidden border-b border-slate-100 last:border-0">
            <div className="container-custom">
                <div className={cn("flex flex-col gap-12 lg:gap-20 items-center", reversed ? "lg:flex-row-reverse" : "lg:flex-row")}>

                    {/* Text Content */}
                    <motion.div
                        initial={{ opacity: 0, x: reversed ? 30 : -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="flex-1 space-y-6"
                    >
                        <div className={cn("inline-block p-3 rounded-lg bg-gradient-to-r text-white shadow-md", gradient)}>
                            <div className="w-6 h-6 rounded-full bg-white/20" />
                        </div>

                        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight">
                            {title}
                        </h2>
                        <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
                            {description}
                        </p>

                        {notes.length > 0 && (
                            <ul className="space-y-3 pt-4">
                                {notes.map((note, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                                        <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                                        {note}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </motion.div>

                    {/* Image / Visual */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="flex-1 w-full"
                    >
                        <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-100 bg-white">
                            {image}
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
