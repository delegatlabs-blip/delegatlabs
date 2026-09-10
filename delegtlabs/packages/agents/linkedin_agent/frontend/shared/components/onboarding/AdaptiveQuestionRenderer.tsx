import type { AdaptiveQuestion } from "@shared/api";
import { formatEnumLabel } from "@shared/lib/format-label";
import { CheckboxCard } from "./CheckboxCard";
import { SingleSelectCard } from "./SingleSelectCard";

function toCardOptions(question: AdaptiveQuestion) {
  return (question.options || []).map((o) => ({
    id: o.value,
    label: formatEnumLabel(o.label || o.value),
    description: o.description,
  }));
}

export function isAdaptiveAnswerValid(question: AdaptiveQuestion, value: unknown): boolean {
  if (question.required === false) return true;
  if (question.type === "multi_select") {
    return Array.isArray(value) && value.length > 0;
  }
  return Boolean(String(value ?? "").trim());
}

export function defaultAdaptiveValue(question: AdaptiveQuestion): unknown {
  if (question.type === "multi_select") return [];
  return "";
}

export function AdaptiveQuestionRenderer({
  question,
  value,
  onChange,
}: {
  question: AdaptiveQuestion;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  if (question.type === "multi_select") {
    return (
      <CheckboxCard
        title={question.title}
        subtitle={question.description}
        options={toCardOptions(question)}
        selectedValues={Array.isArray(value) ? (value as string[]) : []}
        onChange={onChange}
        allowCustom={Boolean(question.allowOther)}
        customPlaceholder={question.otherPlaceholder}
      />
    );
  }

  return (
    <SingleSelectCard
      title={question.title}
      subtitle={question.description}
      options={toCardOptions(question)}
      selectedValue={typeof value === "string" ? value : ""}
      onChange={onChange}
      allowOther={Boolean(question.allowOther)}
      otherPlaceholder={question.otherPlaceholder}
    />
  );
}
