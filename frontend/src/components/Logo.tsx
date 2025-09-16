import { motion } from "framer-motion";
import { Tv } from "lucide-react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

const textSizeClasses = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-3xl",
};

export function Logo({ className = "", size = "md" }: LogoProps) {
  return (
    <motion.div
      className={`flex items-center space-x-3 ${className}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className={`${sizeClasses[size]} bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-lg`}
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Tv className="h-1/2 w-1/2 text-white" />
      </motion.div>
      <motion.div
        className="flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <span className={`font-bold ${textSizeClasses[size]} text-gray-900`}>
          ANT <span className="text-ant-blue">Support</span>
        </span>
        {size !== "sm" && (
          <span className="text-xs text-gray-500 -mt-1">
            Digital TV Solutions
          </span>
        )}
      </motion.div>
    </motion.div>
  );
}

export default Logo;
