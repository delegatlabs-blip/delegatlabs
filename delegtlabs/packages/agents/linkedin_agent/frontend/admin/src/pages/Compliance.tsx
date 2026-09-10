import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@shared/api";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Textarea } from "@shared/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card";
import { PageHeader } from "@shared/components/shared-ui";

export default function AdminCompliancePage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-compliance"], queryFn: adminApi.compliance });
  const [industry, setIndustry] = useState("finance");
  const [name, setName] = useState("");
  const [phrases, setPhrases] = useState("");
  const [disc, setDisc] = useState("");

  const mut = useMutation({
    mutationFn: () =>
      adminApi.upsertCompliance({
        industry,
        name,
        forbidden_phrases: phrases.split("\n").map((s) => s.trim()).filter(Boolean),
        required_disclaimers: disc.split("\n").map((s) => s.trim()).filter(Boolean),
      }),
    onSuccess: () => {
      setName("");
      setPhrases("");
      setDisc("");
      qc.invalidateQueries({ queryKey: ["admin-compliance"] });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance"
        description="Global, tenant-non-overridable rule sets by industry. Edits are audited."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {(data?.rules || []).map((r: Record<string, unknown>) => (
          <Card key={String(r.id)}>
            <CardHeader>
              <CardTitle className="text-base">
                {String(r.industry)} — {String(r.name)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <div className="text-xs font-semibold uppercase text-muted-foreground">Forbidden</div>
                <ul className="list-disc pl-4">
                  {(r.forbidden_phrases as string[] || []).map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-muted-foreground">Disclaimers</div>
                <ul className="list-disc pl-4">
                  {(r.required_disclaimers as string[] || []).map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Add / update rule set</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Industry" />
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Rule set name" />
          <Textarea value={phrases} onChange={(e) => setPhrases(e.target.value)} placeholder="Forbidden phrases (one per line)" />
          <Textarea value={disc} onChange={(e) => setDisc(e.target.value)} placeholder="Required disclaimers (one per line)" />
          <Button disabled={!name.trim() || mut.isPending} onClick={() => mut.mutate()}>Save (audited)</Button>
        </CardContent>
      </Card>
    </div>
  );
}
