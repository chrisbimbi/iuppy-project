"use client";

import { Section } from "@/components/ui/section";

const integrations = [
    "Microsoft 365", "Sharepoint", "Workday", "SAP SuccessFactors", "ADP", "Totvs", "Senior", "Slack", "Teams", "Salesforce", "ServiceNow"
];

export function HomeIntegrations() {
    return (
        <Section className="py-20 bg-slate-50 overflow-hidden border-y border-gray-200">
            <div className="container-custom text-center mb-12">
                <h2 className="text-2xl font-bold text-slate-900">Conecta com tudo o que você já usa</h2>
            </div>

            <div className="relative flex overflow-x-hidden group">
                <div className="animate-marquee whitespace-nowrap flex gap-16 items-center">
                    {[...integrations, ...integrations, ...integrations].map((item, i) => (
                        <span key={i} className="text-2xl font-bold text-slate-300 uppercase tracking-widest hover:text-iuppy-blue transition-colors cursor-default">
                            {item}
                        </span>
                    ))}
                </div>
            </div>
        </Section>
    );
}
