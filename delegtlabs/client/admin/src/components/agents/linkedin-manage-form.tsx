import { useState } from "react";
import { Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LinkedInAgentConfig } from "./agent-types";

function TagList({
  tags,
  onRemove,
}: {
  tags: string[];
  onRemove: (tag: string) => void;
}) {
  return (
    <div className="mb-2 flex flex-wrap gap-2">
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => onRemove(tag)}
          className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs text-primary"
        >
          {tag} <X className="h-3 w-3" />
        </button>
      ))}
    </div>
  );
}

function csvToList(value: string) {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function LinkedInManageForm({
  value,
  onChange,
  onSave,
  saving,
}: {
  value: LinkedInAgentConfig;
  onChange: (next: LinkedInAgentConfig) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const [pillar, setPillar] = useState("");
  const [postType, setPostType] = useState("");
  const [source, setSource] = useState("");

  const setLead = <K extends keyof LinkedInAgentConfig["lead_gen"]>(
    key: K,
    val: LinkedInAgentConfig["lead_gen"][K],
  ) => onChange({ ...value, lead_gen: { ...value.lead_gen, [key]: val } });

  const setPost = <K extends keyof LinkedInAgentConfig["post_gen"]>(
    key: K,
    val: LinkedInAgentConfig["post_gen"][K],
  ) => onChange({ ...value, post_gen: { ...value.post_gen, [key]: val } });

  const setWeight = (key: string, next: number) =>
    setPost("topic_weights", { ...value.post_gen.topic_weights, [key]: next });

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
            High-level guidance the agent should follow when generating posts and outreach.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={4}
            value={value.post_gen.user_instructions}
            onChange={(e) => setPost("user_instructions", e.target.value)}
            placeholder="Tone, CTA style, topics to avoid…"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audience & lead criteria</CardTitle>
          <CardDescription>
            Target roles, industries, geography, and scoring used for lead generation.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Target audience</Label>
            <Input
              value={value.lead_gen.target_audience}
              onChange={(e) => setLead("target_audience", e.target.value)}
              placeholder="e.g. B2B SaaS decision makers"
            />
          </div>
          <div className="space-y-2">
            <Label>Target job titles</Label>
            <Input
              value={value.lead_gen.target_job_titles.join(", ")}
              onChange={(e) => setLead("target_job_titles", csvToList(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Industries</Label>
            <Input
              value={value.lead_gen.industries.join(", ")}
              onChange={(e) => setLead("industries", csvToList(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Company size</Label>
            <Input
              value={value.lead_gen.company_size.join(", ")}
              onChange={(e) => setLead("company_size", csvToList(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Geography</Label>
            <Input
              value={value.lead_gen.geography.join(", ")}
              onChange={(e) => setLead("geography", csvToList(e.target.value))}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <div className="flex justify-between text-sm">
              <Label>Score threshold</Label>
              <span className="text-muted-foreground">{value.lead_gen.score_threshold}</span>
            </div>
            <Slider
              min={0}
              max={100}
              step={1}
              value={[value.lead_gen.score_threshold]}
              onValueChange={([v]) => setLead("score_threshold", v)}
            />
          </div>
          <div className="space-y-2">
            <Label>Daily connection cap</Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={value.lead_gen.daily_connection_cap}
              onChange={(e) => setLead("daily_connection_cap", Number(e.target.value) || 1)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Connection message template</Label>
            <Textarea
              rows={3}
              value={value.lead_gen.connection_message_template}
              onChange={(e) => setLead("connection_message_template", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Tokens: {"{{first_name}}"}, {"{{company}}"}, {"{{industry}}"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Post types, pillars & topic mix</CardTitle>
          <CardDescription>
            Content pillars, post formats, and relative topic weights for the PR pipeline.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label className="mb-2 block">Content pillars</Label>
            <TagList
              tags={value.post_gen.content_pillars}
              onRemove={(tag) =>
                setPost(
                  "content_pillars",
                  value.post_gen.content_pillars.filter((t) => t !== tag),
                )
              }
            />
            <div className="flex gap-2">
              <Input
                value={pillar}
                onChange={(e) => setPillar(e.target.value)}
                placeholder="Add pillar…"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (!pillar.trim()) return;
                  setPost("content_pillars", [...value.post_gen.content_pillars, pillar.trim()]);
                  setPillar("");
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Post types</Label>
            <TagList
              tags={value.post_gen.post_types}
              onRemove={(tag) =>
                setPost(
                  "post_types",
                  value.post_gen.post_types.filter((t) => t !== tag),
                )
              }
            />
            <div className="flex gap-2">
              <Input
                value={postType}
                onChange={(e) => setPostType(e.target.value)}
                placeholder="e.g. carousel, poll, case_study"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (!postType.trim()) return;
                  setPost("post_types", [...value.post_gen.post_types, postType.trim()]);
                  setPostType("");
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {Object.entries(value.post_gen.topic_weights).map(([key, weight]) => (
              <div key={key}>
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span className="capitalize">{key.replaceAll("_", " ")}</span>
                  <span>{Math.round(weight * 100)}%</span>
                </div>
                <Slider
                  min={0}
                  max={1}
                  step={0.05}
                  value={[weight]}
                  onValueChange={([v]) => setWeight(key, v)}
                />
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tone</Label>
              <Input
                value={value.post_gen.tone}
                onChange={(e) => setPost("tone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Posting frequency</Label>
              <Select
                value={value.post_gen.posting_frequency}
                onValueChange={(v) => setPost("posting_frequency", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="3x_per_week">3× per week</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Biweekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Approval mode</Label>
              <Select
                value={value.post_gen.approval_mode}
                onValueChange={(v) =>
                  setPost("approval_mode", v as LinkedInAgentConfig["post_gen"]["approval_mode"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="review_first">Review first</SelectItem>
                  <SelectItem value="auto_publish">Auto publish</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Models & image quality</CardTitle>
          <CardDescription>
            Generation model preference and visual style for post imagery.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>AI model</Label>
            <Select
              value={value.post_gen.ai_model}
              onValueChange={(v) =>
                setPost("ai_model", v as LinkedInAgentConfig["post_gen"]["ai_model"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                <SelectItem value="gpt-4.1">GPT-4.1</SelectItem>
                <SelectItem value="claude-sonnet">Claude Sonnet</SelectItem>
                <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                <SelectItem value="mock">Mock (offline)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Image quality</Label>
            <Select
              value={value.post_gen.image_quality}
              onValueChange={(v) =>
                setPost("image_quality", v as LinkedInAgentConfig["post_gen"]["image_quality"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="ultra">Ultra</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Image style</Label>
            <Input
              value={value.post_gen.image_style}
              onChange={(e) => setPost("image_style", e.target.value)}
              placeholder="e.g. flat illustration, photo-real product shot"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">News sources</CardTitle>
          <CardDescription>RSS feeds used for industry news commentary posts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="space-y-2">
            {value.post_gen.news_sources.map((src) => (
              <li
                key={src}
                className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
              >
                <span className="truncate font-mono text-xs">{src}</span>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() =>
                    setPost(
                      "news_sources",
                      value.post_gen.news_sources.filter((s) => s !== src),
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="https://…/feed/"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!source.trim()) return;
                setPost("news_sources", [...value.post_gen.news_sources, source.trim()]);
                setSource("");
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving} className="shadow-elegant">
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save LinkedIn config"}
        </Button>
      </div>
    </form>
  );
}
