import { getPostBySlug, getSortedPostsData } from '@/lib/blog';
import { MDXRemote } from 'next-mdx-remote/rsc';
import components from '@/components/blog/mdx-components';
import { Section } from '@/components/ui/section';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, Share2, User } from 'lucide-react';
import { notFound } from 'next/navigation';
import { PreFooterCTA } from '@/components/layout/PreFooterCTA';

export async function generateStaticParams() {
    const posts = getSortedPostsData();
    return posts.map((post) => ({
        slug: post.slug,
    }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const post = getPostBySlug(slug);
    if (!post) return;

    return {
        title: `${post.frontmatter.title} | Blog Iuppy`,
        description: post.frontmatter.excerpt,
    };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const post = getPostBySlug(slug);

    if (!post) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-white pt-20">

            {/* Article Header */}
            <header className="bg-slate-50 py-16 border-b border-slate-100">
                <div className="container-custom max-w-4xl">
                    <Link href="/resources/blog" className="inline-flex items-center text-slate-500 hover:text-iuppy-blue mb-8 font-medium transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para o Blog
                    </Link>

                    <div className="flex gap-2 mb-6">
                        {post.frontmatter.tags.map(tag => (
                            <span key={tag} className="bg-iuppy-blue/10 text-iuppy-blue px-3 py-1 rounded-full text-sm font-bold tracking-wide uppercase">
                                {tag}
                            </span>
                        ))}
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
                        {post.frontmatter.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-6 text-slate-500 text-sm md:text-base border-t border-slate-200 pt-6">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-slate-500" />
                            </div>
                            <div>
                                <div className="font-bold text-slate-900">{post.frontmatter.author}</div>
                                <div className="text-xs">Autor</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            {post.frontmatter.date}
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            5 min de leitura
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <Section className="py-12">
                <div className="max-w-3xl mx-auto prose prose-lg prose-slate prose-headings:font-bold prose-headings:tracking-tight prose-a:text-iuppy-blue prose-img:rounded-xl">
                    <MDXRemote source={post.content} components={components} />
                </div>
            </Section>

            {/* Share / Bottom CTA */}
            <div className="bg-slate-50 py-12 border-t border-slate-100">
                <div className="container-custom max-w-3xl text-center">
                    <h3 className="text-2xl font-bold text-slate-900 mb-6">Compartilhe este conhecimento</h3>
                    <div className="flex justify-center gap-4 mb-12">
                        <Button variant="outline" className="gap-2">
                            <Share2 className="w-4 h-4" /> LinkedIn
                        </Button>
                        <Button variant="outline" className="gap-2">
                            <Share2 className="w-4 h-4" /> WhatsApp
                        </Button>
                    </div>
                </div>
            </div>

            <PreFooterCTA />
        </main>
    );
}
