import { useEffect, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AgentDrawer } from "@/components/agents/agent-drawer";
import { LinkedInManageForm } from "@/components/agents/linkedin-manage-form";
import { LawyerManageForm } from "@/components/agents/lawyer-manage-form";
import { deleteAgent, getAgent, updateAgent } from "@/components/agents/agent-store";
import {
  isLinkedInConfig,
  isLawyerConfig,
  type AgentRecord,
  type LawyerAgentConfig,
  type LinkedInAgentConfig,
} from "@/components/agents/agent-types";

export const Route = createFileRoute("/_app/agents/$agentId")({
  head: () => ({
    meta: [
      { title: "Manage agent — Delegate Labs" },
      { name: "description", content: "Configure agent instructions, models, and audience." },
    ],
  }),
  component: AgentManagePage,
});

function AgentManagePage() {
  const { agentId } = Route.useParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<AgentRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [missing, setMissing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const reload = async () => {
    setLoading(true);
    const found = await getAgent(agentId);
    if (!found) {
      setMissing(true);
      setAgent(null);
      setLoading(false);
      return;
    }
    setMissing(false);
    setAgent(found);
    setLoading(false);
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  if (loading) {
    return (
      <div className="rounded-2xl border px-6 py-16 text-center text-sm text-muted-foreground">
        Loading agent…
      </div>
    );
  }

  if (missing || !agent) {
    return (
      <div className="rounded-2xl border border-dashed px-6 py-16 text-center">
        <p className="text-sm font-medium">Agent not found</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/agents">Back to agents</Link>
        </Button>
      </div>
    );
  }

  const persistConfig = async (config: LinkedInAgentConfig | LawyerAgentConfig) => {
    setSaving(true);
    const updated = await updateAgent(agent.id, { config });
    if (updated) setAgent(updated);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"
      >
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2 text-muted-foreground">
            <Link to="/agents">
              <ArrowLeft className="h-4 w-4" /> Back to agents
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">{agent.name}</h1>
            <Badge variant="secondary" className="capitalize">
              {agent.slug.replace("-agent", "")}
            </Badge>
            <Badge
              variant="outline"
              className={
                agent.status === "active"
                  ? "border-success/40 text-success"
                  : agent.status === "paused"
                    ? "border-warning/40 text-warning-foreground"
                    : ""
              }
            >
              {agent.status}
            </Badge>
          </div>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{agent.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setDrawerOpen(true)}>
            <Pencil className="h-4 w-4" /> Edit details
          </Button>
          <Button
            variant="outline"
            className="text-destructive hover:bg-destructive/10"
            onClick={async () => {
              if (!confirm("Delete this agent?")) return;
              await deleteAgent(agent.id);
              navigate({ to: "/agents" });
            }}
          >
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </motion.div>

      {saved ? (
        <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">
          <CheckCircle2 className="h-4 w-4" /> Changes saved.
        </div>
      ) : null}

      {isLinkedInConfig(agent.slug, agent.config) ? (
        <LinkedInManageForm
          value={agent.config}
          onChange={(config) => setAgent({ ...agent, config })}
          onSave={() => persistConfig(agent.config)}
          saving={saving}
        />
      ) : null}

      {isLawyerConfig(agent.slug, agent.config) ? (
        <LawyerManageForm
          value={agent.config}
          onChange={(config) => setAgent({ ...agent, config })}
          onSave={() => persistConfig(agent.config)}
          saving={saving}
        />
      ) : null}

      <AgentDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        agent={agent}
        onSaved={() => {
          void reload();
        }}
      />
    </div>
  );
}
