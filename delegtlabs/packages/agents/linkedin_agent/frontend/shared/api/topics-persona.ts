import { api } from "./index";

export interface TopicOption {
  value: string;
  label: string;
  description?: string | null;
}

export interface TopicPersona {
  id: number;
  name: string;
  slug: string;
  weight: number;
  is_active: boolean;
  published_count: number;
  avg_score: number | null;
  created_at: string;
  updated_at: string;
  persona_generated: boolean;
  selected_option_value: string | null;
  options: TopicOption[];
}

export interface GeneratePersonaTopicsResponse {
  ok: true;
  topics: TopicPersona[];
}

export function listPersonaTopics(): Promise<TopicPersona[]> {
  return api.get<TopicPersona[] | { detail?: string }>("/topics").then((r) => {
    const data = r.data;
    return Array.isArray(data) ? data : [];
  });
}

export function generatePersonaTopics(): Promise<GeneratePersonaTopicsResponse> {
  return api
    .post<GeneratePersonaTopicsResponse>("/topics/generate-persona", undefined, { timeout: 120000 })
    .then((r) => r.data);
}

export function patchPersonaTopic(
  id: number,
  data: Partial<Pick<TopicPersona, "weight" | "is_active" | "name" | "selected_option_value">>,
): Promise<TopicPersona> {
  return api.patch<TopicPersona>(`/topics/${id}`, data).then((r) => r.data);
}
