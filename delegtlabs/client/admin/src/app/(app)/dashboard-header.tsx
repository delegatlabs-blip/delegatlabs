"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function DashboardHeader({ children }: { children: ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col justify-between gap-4 md:flex-row md:items-end"
    >
      {children}
    </motion.section>
  );
}
