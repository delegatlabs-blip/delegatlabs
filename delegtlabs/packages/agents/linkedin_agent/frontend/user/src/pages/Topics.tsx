import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sliders, Save, Loader2, Info, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { settingsApi, onboardingApi, type OnboardingAnswers } from "@shared/api";
import {
  generatePersonaTopics,
  listPersonaTopics,
  type TopicPersona,
} from "@shared/api/topics-persona";
import { FlashcardFlow } from "@shared/components/onboarding/FlashcardFlow";
import { Button } from "@shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Switch } from "@shared/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select";
import { Skeleton } from "@shared/components/ui/skeleton";
import { Alert, AlertDescription } from "@shared/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/components/ui/tabs";
import { PageHeader, CardsSkeleton } from "@shared/components/shared-ui";
import { apiErrorMessage } from "@/pages/agents/post-gen/api-error";
import { TopicRow } from "@/pages/TopicRow";

function StyleSettings() {
  const qc = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: settingsApi.get,
  });

  const [form, setForm] = useState({
    default_tone: "",
    post_length: "",
    hashtag_count: "",
    posts_per_week: "",
    auto_publish_enabled: "",
  });
  const [initialized, setInitialized] = useState(false);

  if (settings && !initialized) {
    setForm({
      default_tone: settings["default_tone"]?.value ?? "casual",
      post_length: settings["post_length"]?.value ?? "medium",
      hashtag_count: settings["hashtag_count"]?.value ?? "4",
      posts_per_week: settings["posts_per_week"]?.value ?? "3",
      auto_publish_enabled: settings["auto_publish_enabled"]?.value ?? "false",
    });
    setInitialized(true);
  }

  const mutation = useMutation({
    mutationFn: () => settingsApi.patch(form),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });

  if (isLoading) return <Skeleton className="h-48 rounded-xl" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Style & Schedule Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Default Tone</Label>
            <Select
              value={form.default_tone}
              onValueChange={(v) => setForm((f) => ({ ...f, default_tone: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="casual">Casual — Conversational & relatable</SelectItem>
                <SelectItem value="formal">Formal — Authoritative & polished</SelectItem>
                <SelectItem value="witty">Witty — Clever with light humor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Post Length</Label>
            <Select
              value={form.post_length}
              onValueChange={(v) => setForm((f) => ({ ...f, post_length: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Short (150–250 words)</SelectItem>
                <SelectItem value="medium">Medium (250–400 words)</SelectItem>
                <SelectItem value="long">Long (400–600 words)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Hashtag Count</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={form.hashtag_count}
              onChange={(e) => setForm((f) => ({ ...f, hashtag_count: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Target Posts Per Week</Label>
            <Input
              type="number"
              min={1}
              max={21}
              value={form.posts_per_week}
              onChange={(e) => setForm((f) => ({ ...f, posts_per_week: e.target.value }))}
              disabled
            />
          </div>

          <div className="col-span-full flex items-center justify-between rounded-lg border p-3">
            <div>
              <div className="text-sm font-medium">Auto-Publish</div>
              <div className="text-xs text-muted-foreground">
                Publish approved posts automatically on schedule
              </div>
            </div>
            <Switch
              checked={form.auto_publish_enabled === "true"}
              onCheckedChange={(v) =>
                setForm((f) => ({ ...f, auto_publish_enabled: v ? "true" : "false" }))
              }
            />
          </div>
        </div>

        <Alert>
          <Info className="size-4" />
          <AlertDescription className="text-xs">
            Topic weights auto-adjust based on post engagement. Manual overrides take effect for
            the next generation cycle.
          </AlertDescription>
        </Alert>

        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Save className="size-3.5" />
          )}
          Save Settings
        </Button>

        {mutation.isSuccess && (
          <p className="text-xs text-success">Settings saved</p>
        )}
      </CardContent>
    </Card>
  );
}

function personaGeneratedCount(topics: TopicPersona[] | undefined): number {
  return (Array.isArray(topics) ? topics : []).filter((t) => t.persona_generated === true).length;
}

export default function Topics() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab = tabParam === "weights" || tabParam === "onboarding" ? tabParam : "onboarding";

  const { data: onboarding, isLoading: onboardingLoading } = useQuery({
    queryKey: ["onboarding"],
    queryFn: onboardingApi.get,
  });
  const listQuery = useQuery({
    queryKey: ["topics"],
    queryFn: listPersonaTopics,
  });

  const adaptiveCompleted =
    onboarding?.adaptive?.status === "completed" || onboarding?.adaptive?.complete === true;
  const topics = listQuery.data;
  const personaReady = personaGeneratedCount(topics) === 10;
  const needsGenerate =
    !onboardingLoading &&
    adaptiveCompleted &&
    !listQuery.isLoading &&
    !listQuery.isError &&
    !personaReady;

  const generateMut = useMutation({
    mutationFn: generatePersonaTopics,
    onSuccess: (res) => {
      qc.setQueryData(["topics"], res.topics);
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err, "Could not generate topics"));
    },
  });
  const runGenerate = generateMut.mutate;
  const generateStartedRef = useRef(false);

  useEffect(() => {
    if (personaReady) generateStartedRef.current = false;
  }, [personaReady]);

  useEffect(() => {
    if (!needsGenerate || generateStartedRef.current || generateMut.isPending) return;
    generateStartedRef.current = true;
    runGenerate();
  }, [needsGenerate, runGenerate]);

  const hidePicker =
    adaptiveCompleted &&
    (listQuery.isLoading ||
      generateMut.isPending ||
      (needsGenerate && !generateMut.isError && !generateMut.isSuccess));
  const topicList = Array.isArray(topics) ? topics : [];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <PageHeader
        title="Topics"
        description="Edit your content persona or manage topic status (many topics can be Active)"
      />

      <Tabs
        value={tab}
        onValueChange={(next) => {
          const params = new URLSearchParams(searchParams);
          params.set("tab", next);
          setSearchParams(params, { replace: true });
        }}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabsList className="shrink-0">
          <TabsTrigger value="onboarding" className="gap-1.5">
            <Sparkles className="size-3.5" />
            Persona
          </TabsTrigger>
          <TabsTrigger value="weights" className="gap-1.5">
            <Sliders className="size-3.5" />
            Topic Weights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="onboarding" className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden">
          <FlashcardFlow
            mode="edit"
            initialAnswers={(onboarding?.answers as OnboardingAnswers | null) ?? null}
            onCompleted={() => {
              qc.invalidateQueries({ queryKey: ["onboarding"] });
              qc.invalidateQueries({ queryKey: ["topics"] });
            }}
          />
        </TabsContent>

        <TabsContent value="weights" className="mt-4 min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain">
          {hidePicker ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Generating topics…
              </div>
              <CardsSkeleton count={6} />
            </div>
          ) : adaptiveCompleted && generateMut.isError ? (
            <Alert variant="destructive">
              <AlertDescription className="space-y-3">
                <p>{apiErrorMessage(generateMut.error, "Could not generate topics")}</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    generateStartedRef.current = true;
                    runGenerate();
                  }}
                  disabled={generateMut.isPending}
                >
                  {generateMut.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : null}
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          ) : listQuery.isLoading ? (
            <CardsSkeleton count={6} />
          ) : (
            <>
              <Alert>
                <Info className="size-4" />
                <AlertDescription>
                  Topics start as Draft. Toggle any number to Active. Unselected stay Draft. Pick exactly one option per topic.
                </AlertDescription>
              </Alert>
              <div>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Sliders className="size-3.5" />
                  Topics
                  <span className="font-normal">(Active vs Draft · weight applies when active)</span>
                </h2>
                <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {topicList.map((topic) => (
                    <TopicRow key={topic.id} topic={topic} />
                  ))}
                </div>
              </div>
              <StyleSettings />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
