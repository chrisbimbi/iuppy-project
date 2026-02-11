"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const AccordionContext = React.createContext<{
    value: string | undefined;
    onValueChange: (value: string) => void;
}>({
    value: undefined,
    onValueChange: () => { },
});

interface AccordionProps {
    children: React.ReactNode;
    type?: "single" | "multiple"; // supporting single for now as per use case
    collapsible?: boolean;
    defaultValue?: string;
    className?: string;
}

const Accordion = ({ children, className, type = "single" }: AccordionProps) => {
    const [value, setValue] = React.useState<string | undefined>(undefined);

    return (
        <AccordionContext.Provider value={{ value, onValueChange: (newValue) => setValue(value === newValue ? undefined : newValue) }}>
            <div className={cn("space-y-2", className)}>
                {children}
            </div>
        </AccordionContext.Provider>
    );
};

interface AccordionItemProps {
    children: React.ReactNode;
    value: string;
    className?: string;
}

const AccordionItem = ({ children, value, className }: AccordionItemProps) => {
    const context = React.useContext(AccordionContext);
    const isOpen = context.value === value;

    // Clone AccordionTrigger to pass toggle functionality and open state
    // Clone AccordionContent to pass open state
    const childrenWithProps = React.Children.map(children, child => {
        if (React.isValidElement(child)) {
            // @ts-ignore
            if (child.type.displayName === "AccordionTrigger") {
                return React.cloneElement(child as React.ReactElement<any>, {
                    isOpen,
                    onClick: () => context.onValueChange(value)
                });
            }
            // @ts-ignore
            if (child.type.displayName === "AccordionContent") {
                return React.cloneElement(child as React.ReactElement<any>, { isOpen });
            }
        }
        return child;
    });

    return (
        <div className={cn("border-b", className)}>
            {childrenWithProps}
        </div>
    );
};

interface AccordionTriggerProps {
    children: React.ReactNode;
    className?: string;
    isOpen?: boolean; // injected by Item
    onClick?: () => void; // injected by Item
}

const AccordionTrigger = ({ children, className, isOpen, onClick }: AccordionTriggerProps) => {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline w-full text-left",
                className
            )}
        >
            {children}
            <ChevronDown
                className={cn(
                    "h-4 w-4 shrink-0 transition-transform duration-200",
                    isOpen && "rotate-180"
                )}
            />
        </button>
    );
};
AccordionTrigger.displayName = "AccordionTrigger";

interface AccordionContentProps {
    children: React.ReactNode;
    className?: string;
    isOpen?: boolean; // injected by Item
}

const AccordionContent = ({ children, className, isOpen }: AccordionContentProps) => {
    return (
        <AnimatePresence initial={false}>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                >
                    <div className={cn("pb-4 pt-0", className)}>{children}</div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
AccordionContent.displayName = "AccordionContent";

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
