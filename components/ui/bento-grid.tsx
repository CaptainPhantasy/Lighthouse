import { cn } from "@/lib/utils";
import { motion } from "motion/react";

export interface BentoCardProps {
  className?: string;
  title?: string;
  description?: string;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  type?: "default" | "primary" | "success" | "warning";
  size?: "sm" | "md" | "lg" | "xl";
  children?: React.ReactNode;
  colSpan?: 1 | 2;
  rowSpan?: 1 | 2;
  onClick?: () => void;
  index?: number;
  isDark?: boolean;
}

const BentoCard = ({
  className,
  title,
  description,
  header,
  icon,
  type = "default",
  size = "md",
  children,
  colSpan = 1,
  rowSpan = 1,
  onClick,
  index = 0,
  isDark = false,
}: BentoCardProps) => {
  // Clean black/white theme with dark mode support
  const typeStyles = {
    default: isDark
      ? "bg-stone-900 border-stone-800 text-white"
      : "bg-white border-stone-200 text-black",
    primary: isDark
      ? "bg-white text-black border-stone-600"
      : "bg-black text-white border-stone-800",
    success: isDark
      ? "bg-stone-800 border-stone-700 text-white"
      : "bg-stone-100 border-stone-300 text-black",
    warning: isDark
      ? "bg-stone-800 border-stone-700 text-white"
      : "bg-stone-100 border-stone-300 text-black",
  };

  const sizeStyles = {
    sm: "p-4",
    md: "p-5",
    lg: "p-6",
    xl: "p-7",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={onClick ? { y: -4, transition: { duration: 0.2 } } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={cn(
        "relative rounded-2xl border transition-shadow duration-300",
        typeStyles[type],
        sizeStyles[size],
        colSpan > 1 && "md:col-span-2",
        rowSpan > 1 && "md:row-span-2",
        onClick && "cursor-pointer hover:shadow-lg",
        className
      )}
    >
      {header && <div className="mb-3">{header}</div>}
      <div className="flex items-start gap-3">
        {icon && <div className="flex-shrink-0">{icon}</div>}
        <div className="flex-1 min-w-0">
          {title && <h3 className="font-semibold">{title}</h3>}
          {description && <p className="text-sm opacity-70 mt-1">{description}</p>}
          {children}
        </div>
      </div>
    </motion.div>
  );
};

export interface BentoGridProps {
  className?: string;
  children: React.ReactNode;
  cols?: 2 | 3 | 4;
}

const BentoGrid = ({ className, children, cols = 3 }: BentoGridProps) => {
  const colsStyles = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
  };

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4",
        colsStyles[cols],
        className
      )}
    >
      {children}
    </div>
  );
};

export { BentoCard, BentoGrid };
