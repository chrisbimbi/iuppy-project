"use client";

import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { CheckCircle2, MessageSquare, Mail, Play } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ThankYouPage() {
    return (
        <div className="min-h-screen bg-slate-50 pt-20">
            <Section className="py-20">
                <div className="max-w-3xl mx-auto text-center space-y-8">

                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto"
                    >
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </motion.div>

                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                        Solicitação recebida com sucesso!
                    </h1>

                    <p className="text-xl text-slate-600 leading-relaxed">
                        Nossa equipe de especialistas já recebeu seus dados. Entraremos em contato em até <strong>2 horas úteis</strong> para agendar sua demonstração personalizada.
                    </p>

                    {/* Native Video Player */}
                    <VideoPlayer />

                    {/* Urgent Action */}
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-amber-100 mt-12">
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">Precisa de urgência?</h3>
                        <p className="text-slate-600 mb-6">
                            Se sua empresa está passando por auditoria ou precisa resolver problemas de comunicação imediatamente, pule a fila.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="https://wa.me/5511983264559?text=Ol%C3%A1%2C%20acabei%20de%20solicitar%20uma%20demo%20no%20site%20e%20gostaria%20de%20prioridade." target="_blank">
                                <Button size="lg" className="w-full sm:w-auto h-14 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold shadow-lg shadow-green-500/20 text-lg">
                                    <MessageSquare className="mr-2 w-5 h-5" />
                                    Falar no WhatsApp Agora
                                </Button>
                            </Link>

                        </div>
                    </div>

                </div>
            </Section>
        </div>
    );
}

function VideoPlayer() {
    // Dynamic import to avoid hydration issues with useRef/DOM if needed, 
    // but here we are in a "use client" file so standard hooks work fine.
    const { useState, useRef } = require("react");
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
                setIsPlaying(false);
            } else {
                videoRef.current.play();
                setIsPlaying(true);
            }
        }
    };

    return (
        <div
            className="aspect-video bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border-4 border-white relative group cursor-pointer"
            onClick={togglePlay}
        >
            <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                poster="/images/blog/iuppy_hr_director_portrait.png"
                onEnded={() => setIsPlaying(false)}
            >
                <source src="/videos/video_obrigado.mp4" type="video/mp4" />
                Seu navegador não suporta a tag de vídeo.
            </video>

            {/* Content Overlay - Hidden when playing */}
            {!isPlaying && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center transition-all duration-300">
                    <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border-2 border-white/50 pl-2">
                        <Play className="w-12 h-12 text-white fill-white" />
                    </div>
                </div>
            )}
        </div>
    );
}
