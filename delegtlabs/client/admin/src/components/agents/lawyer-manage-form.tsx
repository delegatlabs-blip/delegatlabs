import { useState } from "react";
import { Plus, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LawyerAgentConfig } from "./agent-types";

export function LawyerManageForm({
  value,
  onChange,
  onSave,
  saving,
}: {
  value: LawyerAgentConfig;
  onChange: (next: LawyerAgentConfig) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const [area, setArea] = useState("");

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">User instructions</CardTitle>
          <CardDescription>
            Drafting preferences and guardrails for the lawyer agent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={4}
            value={value.user_instructions}
            onChange={(e) => onChange({ ...value, user_instructions: e.target.value })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Jurisdiction, parties & model</CardTitle>
          <CardDescription>
            Defaults applied when opening a new draft intake.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Firm / party default name</Label>
            <Input
              value={value.firm_name}
              onChange={(e) => onChange({ ...value, firm_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Jurisdiction default</Label>
            <Input
              value={value.jurisdiction}
              onChange={(e) => onChange({ ...value, jurisdiction: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>UI language</Label>
            <Select
              value={value.ui_language}
              onValueChange={(v) =>
                onChange({ ...value, ui_language: v as LawyerAgentConfig["ui_language"] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">Hindi</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Default draft language</Label>
            <Select
              value={value.draft_language}
              onValueChange={(v) =>
                onChange({ ...value, draft_language: v as LawyerAgentConfig["draft_language"] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">Hindi</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Model preference</Label>
            <Select
              value={value.ai_provider}
              onValueChange={(v) =>
                onChange({ ...value, ai_provider: v as LawyerAgentConfig["ai_provider"] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mock">Mock (default)</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="gemini">Gemini</SelectItem>
                <SelectItem value="claude">Claude</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label className="mb-2 block">Practice areas</Label>
            <div className="mb-2 flex flex-wrap gap-2">
              {value.practice_areas.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...value,
                      practice_areas: value.practice_areas.filter((t) => t !== tag),
                    })
                  }
                  className="inline-flex items-center gap-1 rounded-full border border-info/30 bg-info/10 px-2.5 py-1 text-xs text-info-foreground"
                >
                  {tag} <X className="h-3 w-3" />
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="Add practice area…"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (!area.trim()) return;
                  onChange({
                    ...value,
                    practice_areas: [...value.practice_areas, area.trim()],
                  });
                  setArea("");
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving} className="shadow-elegant">
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save lawyer config"}
        </Button>
      </div>
    </form>
  );
}
