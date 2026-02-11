import { LeadTrigger, BlogCTA, PromptImage } from './BlogClientComponents';
import Image from 'next/image';
import Link from 'next/link';

// Defines the mapping of Markdown elements to React components
const components = {
    LeadTrigger,
    BlogCTA,
    PromptImage,
    Image,
    Link,
    h1: (props: any) => <h1 className="text-4xl font-extrabold mt-12 mb-6 text-slate-900 tracking-tight" {...props} />,
    h2: (props: any) => <h2 className="text-3xl font-bold mt-12 mb-6 text-slate-800" {...props} />,
    h3: (props: any) => <h3 className="text-2xl font-bold mt-8 mb-4 text-slate-800" {...props} />,
    p: (props: any) => <p className="text-lg leading-relaxed text-slate-600 mb-6" {...props} />,
    ul: (props: any) => <ul className="list-disc list-outside ml-6 mb-6 space-y-2 text-lg text-slate-600" {...props} />,
    li: (props: any) => <li {...props} />,
    strong: (props: any) => <strong className="font-bold text-slate-900" {...props} />,
    blockquote: (props: any) => <blockquote className="border-l-4 border-iuppy-orange pl-6 py-2 my-8 italic text-xl text-slate-700 bg-orange-50/50 rounded-r-lg" {...props} />,
    // Map standard markdown images to a responsive styled img
    img: (props: any) => (
        <span className="block my-8 rounded-xl overflow-hidden border border-slate-200 shadow-md">
            <img
                {...props}
                className="w-full h-auto object-cover"
                loading="lazy"
            />
        </span>
    ),
};

export default components;
