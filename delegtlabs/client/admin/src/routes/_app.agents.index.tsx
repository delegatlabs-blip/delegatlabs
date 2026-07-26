import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Bot, Plus, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AgentCard } from "@/components/agents/agent-card";
import { AgentDrawer } from "@/components/agents/agent-drawer";
import { listAgents } from "@/components/agents/agent-store";
import type { AgentRecord } from "@/components/agents/agent-types";

export const Route = createFileRoute("/_app/agents/")({
  head: () => ({
    meta: [
      { title: "Agents — Delegate Labs" },
      {
        name: "description",
        content: "Add and manage LinkedIn and Lawyer agents from the admin console.",
      },
      { property: "og:title", content: "Agents — Delegate Labs" },
      { property: "og:description", content: "Manage your agent fleet." },
    ],
  }),
  component: AgentsPage,
});

function AgentsPage() {
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<AgentRecord | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await listAgents();
      setAgents(data);
    } catch (err) {
      console.error(err);
      setAgents([]);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };

  const openEdit = (agent: AgentRecord) => {
    setEditing(agent);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-end"
      >
        <div>
          <Badge
            variant="secondary"
            className="mb-3 gap-1 rounded-full border-primary/20 bg-primary/10 text-primary"
          >
            <Sparkles className="h-3 w-3" /> Agent module
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Agents</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Add or edit agents from the drawer, then open a card to configure audience, models, and
            instructions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bot className="h-4 w-4 text-primary" />
            {ready ? `${agents.length} registered` : "Loading…"}
          </span>
          <Button className="shadow-elegant" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add agent
          </Button>
        </div>
      </motion.div>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Your agents
        </h2>
        {!ready ? (
          <div className="rounded-2xl border bg-card/50 px-6 py-16 text-center text-sm text-muted-foreground">
            Loading agents…
          </div>
        ) : agents.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card/50 px-6 py-16 text-center">
            <Bot className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium">No agents yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Click Add agent to create your first LinkedIn or Lawyer agent.
            </p>
            <Button className="mt-4 shadow-elegant" onClick={openCreate}>
              <Plus className="h-4 w-4" /> Add agent
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-8">
            {agents.map((agent, i) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * i }}
              >
                <AgentCard agent={agent} onEdit={openEdit} />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <AgentDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        agent={editing}
        onSaved={refresh}
      />
    </div>
  );
}
