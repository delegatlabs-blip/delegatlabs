import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, Navigate, useSearchParams } from "react-router-dom";

import { tenantApi } from "@shared/api";
import { Button } from "@shared/components/ui/button";
import { Card, CardContent } from "@shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/components/ui/tabs";
import { PageHeader } from "@shared/components/shared-ui";

import { PostGenerationTab } from "./post-gen/PostGenerationTab";
import { PostsTab, PostsToolbar } from "./post-gen/PostsTab";

const TABS = ["posts", "generation"] as const;
type Tab = (typeof TABS)[number];

function parseTab(value: string | null): Tab {
  return TABS.includes(value as Tab) ? (value as Tab) : "posts";
}

export default function PostGenAgentPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("tab");
  const tab = parseTab(requested);
  const [localTab, setLocalTab] = useState<Tab>(tab);
  const { data: agentData } = useQuery({
    queryKey: ["agent-config", "post_gen"],
    queryFn: () => tenantApi.agentConfig("post_gen"),
  });

  if (requested === "subscription" || requested === "credits") {
    return <Navigate to="/dashboard/billing" replace />;
  }

  const current = parseTab(searchParams.get("tab") || localTab);

  function setTab(next: string) {
    const value = parseTab(next);
    setLocalTab(value);
    const params = new URLSearchParams(searchParams);
    params.set("tab", value);
    if (value !== "posts") {
      params.delete("page");
      params.delete("limit");
    }
    setSearchParams(params, { replace: true });
  }

  if (agentData?.inactive) {
    return (
      <div className="space-y-4">
        <PageHeader title="Post Gen" description="Agent inactive" />
        <Card>
          <CardContent className="space-y-3 p-6">
            <p className="text-sm text-muted-foreground">Subscribe to unlock Post Gen configuration.</p>
            <Button asChild className="h-10">
              <Link to="/dashboard/billing">Manage Subscription</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={current === "posts" ? "flex min-h-0 flex-1 flex-col gap-6" : "flex flex-col gap-6"}>
      <PageHeader
        title="Post Gen"
        description="Manage and publish your LinkedIn content."
        actions={current === "posts" ? <PostsToolbar /> : undefined}
      />

      <Tabs
        value={current}
        onValueChange={setTab}
        className={current === "posts" ? "flex min-h-0 flex-1 flex-col" : "flex flex-col"}
      >
        <TabsList className="w-max max-w-full shrink-0">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="generation">Post Generation</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4 flex min-h-0 flex-1 flex-col">
          <PostsTab />
        </TabsContent>
        <TabsContent value="generation" className="mt-4 w-full">
          <PostGenerationTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
