import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@shared/api";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select";
import { Badge } from "@shared/components/ui/badge";
import { PageHeader } from "@shared/components/shared-ui";

export default function AdminStaffPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-staff"], queryFn: adminApi.staff });
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("support");

  const mut = useMutation({
    mutationFn: () => adminApi.upsertStaff({ user_id: userId, email, role, display_name: email }),
    onSuccess: () => {
      setUserId("");
      setEmail("");
      qc.invalidateQueries({ queryKey: ["admin-staff"] });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        description="Support is read-only for onboarding/usage — blocked from billing & LinkedIn tokens via RLS + route checks."
      />
      <div className="space-y-2">
        {(data?.staff || []).map((s: Record<string, unknown>) => (
          <div key={String(s.id)} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
            <div>
              <div className="font-medium">{String(s.display_name || s.email)}</div>
              <div className="text-xs text-muted-foreground">{String(s.user_id)}</div>
            </div>
            <Badge variant="secondary">{String(s.role)}</Badge>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Input className="max-w-[10rem]" placeholder="user_id" value={userId} onChange={(e) => setUserId(e.target.value)} />
        <Input className="max-w-xs" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="support">support</SelectItem>
            <SelectItem value="finance">finance</SelectItem>
            <SelectItem value="tech">tech</SelectItem>
          </SelectContent>
        </Select>
        <Button disabled={!userId || !email || mut.isPending} onClick={() => mut.mutate()}>
          Save staff
        </Button>
      </div>
    </div>
  );
}
