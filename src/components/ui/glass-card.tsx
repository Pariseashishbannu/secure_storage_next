import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

interface GlassCardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

export const GlassCard = ({ children, className, hoverEffect = false, ...props }: GlassCardProps) => {
    return (
        <motion.div
            className={cn(
                "glass-card rounded-2xl p-6 text-white border border-white/5 shadow-2xl backdrop-blur-xl bg-black/40",
                hoverEffect && "hover:border-white/10 hover:bg-black/50 transition-colors duration-300",
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    );
};
