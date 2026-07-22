import React from "react";
import { ArrowUpRight } from "lucide-react";

interface ModuleCardProps {
  title: string;
  description: string;
  comingSoon?: boolean;
  active?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
  title,
  description,
  comingSoon = false,
  active = false,
  onClick,
  icon
}) => {
  return (
    <div
      onClick={!comingSoon ? onClick : undefined}
      className={`relative p-6 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
        comingSoon
          ? "bg-slate-50/50 border-slate-200/50 opacity-75 cursor-not-allowed"
          : "bg-white border-slate-200 hover:border-slate-800 hover:shadow-lg cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
      }`}
    >
      {/* Top Section */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-xl border ${
            comingSoon ? "bg-slate-100 border-slate-200/40 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-800"
          }`}>
            {icon}
          </div>
          
          {/* Tag Badges */}
          {comingSoon && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-500">
              Coming Soon
            </span>
          )}
          {active && !comingSoon && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
              Active
            </span>
          )}
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <h3 className="font-bold text-slate-900 text-base">{title}</h3>
          <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
        </div>
      </div>

      {/* Bottom link indicator */}
      {!comingSoon && (
        <div className="flex items-center justify-end mt-4 text-xs font-semibold text-slate-900 group">
          <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-slate-800 transition" />
        </div>
      )}
    </div>
  );
};

export default ModuleCard;
