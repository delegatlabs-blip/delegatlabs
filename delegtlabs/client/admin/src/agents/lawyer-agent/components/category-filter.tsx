import React from "react";
import { getTranslation, Language } from "../lib/i18n";
import { Category } from "../lib/draft-catalog";

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  currentLang: Language;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onCategoryChange,
  currentLang
}) => {
  const t = getTranslation(currentLang);

  const filterItems = [
    { id: "all", label: t.cat_all },
    { id: "agreements", label: t.cat_agreements },
    { id: "legal_notices", label: t.cat_notices },
    { id: "family", label: t.cat_family },
    { id: "criminal", label: t.cat_criminal },
    { id: "civil", label: t.cat_civil },
    { id: "affidavits", label: t.cat_affidavits },
    { id: "lower_court", label: t.cat_lower_court },
    { id: "high_court", label: t.cat_high_court },
    { id: "bail_criminal", label: t.cat_bail_criminal }
  ];

  return (
    <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none w-full">
      {filterItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onCategoryChange(item.id)}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
            selectedCategory === item.id
              ? "bg-slate-900 border-slate-900 text-white"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
