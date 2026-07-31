"use server";

import * as agentService from "../services/agent.service";
import type { AgentCreateInput, AgentRecord, AgentUpdateInput } from "../types";

export async function listAgents(): Promise<AgentRecord[]> {
  return agentService.fetchAgents();
}

export async function getAgent(id: string): Promise<AgentRecord | undefined> {
  try {
    return await agentService.fetchAgent(id);
  } catch {
    return undefined;
  }
}

export async function createAgent(input: AgentCreateInput): Promise<AgentRecord> {
  return agentService.postAgent(input);
}

export async function updateAgent(
  id: string,
  patch: AgentUpdateInput,
): Promise<AgentRecord | undefined> {
  try {
    return await agentService.putAgent(id, patch);
  } catch {
    return undefined;
  }
}

export async function deleteAgent(id: string): Promise<boolean> {
  try {
    await agentService.removeAgent(id);
    return true;
  } catch {
    return false;
  }
}
