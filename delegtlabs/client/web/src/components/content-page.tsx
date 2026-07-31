import type { ReactNode } from "react";

type ContentPageProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
};

export function ContentPage({
  eyebrow,
  title,
  description,
  children,
}: ContentPageProps) {
  return (
    <main className="mx-auto max-w-[800px] px-5 py-14 sm:px-8 sm:py-20">
      {eyebrow ? (
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-blue-600">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-4 text-base leading-relaxed text-slate-600">{description}</p>
      ) : null}
      <div className="prose-content mt-10 space-y-4 text-[15px] leading-relaxed text-slate-600">
        {children}
      </div>
    </main>
  );
}
