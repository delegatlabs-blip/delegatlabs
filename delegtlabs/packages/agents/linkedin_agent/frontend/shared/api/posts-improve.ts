import { api } from "./index";

export interface ImprovePostRequest {
  title: string;
  description: string;
  tags?: string;
}

export interface ImprovePostResponse {
  ok: true;
  html: string;
  plainText: string;
}

export function improvePost(body: ImprovePostRequest): Promise<ImprovePostResponse> {
  return api.post<ImprovePostResponse>("/posts/improve", body, { timeout: 120000 }).then((r) => r.data);
}
