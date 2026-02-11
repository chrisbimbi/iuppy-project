import { cn } from "@/lib/utils";
import React from "react";

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
    children: React.ReactNode;
    fullWidth?: boolean;
}

export const Section = React.forwardRef<HTMLElement, SectionProps>(
    ({ className, children, fullWidth = false, ...props }, ref) => {
        return (
            <section
                ref={ref}
                className={cn("py-16 md:py-24 relative overflow-hidden", className)}
                {...props}
            >
                <div className={cn("container-custom", fullWidth && "max-w-none px-0")}>
                    {children}
                </div>
            </section>
        );
    }
);
Section.displayName = "Section";
