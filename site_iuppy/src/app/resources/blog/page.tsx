import { getSortedPostsData } from '@/lib/blog';
import Link from 'next/link';
import { Section } from '@/components/ui/section';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, User } from 'lucide-react';
import { PreFooterCTA } from '@/components/layout/PreFooterCTA';

export const metadata = {
    title: 'Blog Iuppy | O Futuro da Comunicação Interna e RH',
    description: 'Artigos profundos sobre automação de RH, comunicação inteligente, compliance NR-1 e o fim da gestão fragmentada.',
};

export default function BlogIndex() {
    const allPosts = getSortedPostsData();

    return (
        <main className="min-h-screen bg-slate-50 pt-20">
            {/* Blog Header */}
            <Section className="py-20 bg-slate-900 text-white">
                <div className="max-w-4xl mx-auto text-center space-y-6">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
                        Blog da <span className="text-iuppy-orange">Iuppy</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                        O fim da Comunicação Interna tradicional começa aqui. Insights sobre automação, produtividade e a nova era do RH Estratégico.
                    </p>
                </div>
            </Section>

            {/* Posts Grid */}
            <Section className="py-20">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {allPosts.map((post) => (
                        <Link key={post.slug} href={`/resources/blog/${post.slug}`} className="group block h-full">
                            <article className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-100 h-full flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
                                {/* Cover Image */}
                                <div className="relative h-48 bg-slate-100 overflow-hidden">
                                    {post.frontmatter.coverImage ? (
                                        <img
                                            src={post.frontmatter.coverImage}
                                            alt={post.frontmatter.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                                            <span className="text-4xl opacity-20">📄</span>
                                        </div>
                                    )}
                                    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-iuppy-blue uppercase tracking-wider shadow-sm">
                                        {post.frontmatter.tags[0]}
                                    </div>
                                </div>

                                <div className="p-6 flex flex-col flex-1">
                                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {post.frontmatter.date}</span>
                                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {post.frontmatter.author}</span>
                                    </div>

                                    <h2 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-iuppy-blue transition-colors line-clamp-2">
                                        {post.frontmatter.title}
                                    </h2>

                                    <p className="text-slate-600 text-sm leading-relaxed mb-6 line-clamp-3">
                                        {post.frontmatter.excerpt}
                                    </p>

                                    <div className="mt-auto flex items-center text-iuppy-orange font-bold text-sm group-hover:translate-x-2 transition-transform">
                                        Ler artigo completo <ArrowRight className="ml-1 w-4 h-4" />
                                    </div>
                                </div>
                            </article>
                        </Link>
                    ))}
                </div>
            </Section>

            <PreFooterCTA />
        </main>
    );
}
