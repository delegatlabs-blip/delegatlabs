export interface CaseParty {
  sideLabel: "A" | "B";
  partyName: string;
  legalRole: string;
  isClient: boolean;
  mobile?: string;
  address?: string;
}

export interface CaseRecord {
  id: string;
  caseTitle: string;
  caseType: string;
  courtType: string;
  courtName: string;
  courtNumber?: string;
  caseNumber?: string;
  cnrNumber?: string;
  firNumber?: string;
  policeStation?: string;
  sections?: string;
  stage: string;
  remarks?: string;
  previousDate?: string;
  nextDate?: string;
  fof?: string;
  nextAction?: string;
  rawNotes?: string;
  
  // Hardened Party Setup fields
  partyA: {
    name: string;
    legalRole: string;
  };
  partyB: {
    name: string;
    legalRole: string;
  };
  clientParty: "partyA" | "partyB";
  clientRole: string;
  clientName: string;
  
  status?: "active" | "archived";
  createdAt: string;
  updatedAt?: string;
}

export interface TimelineEvent {
  id: string;
  caseId: string;
  eventType: "Hearing" | "Filing" | "Order" | "Draft Prepared" | "Client Follow-up" | "Note" | "Other";
  eventDate: string;
  title: string;
  description: string;
  createdAt: string;
}

export interface CaseDraftContext {
  caseId: string;
  draftId: string;
  caseTitle: string;
  caseType: string;
  clientName: string;
  clientRole: string;
  oppositePartyName: string;
  oppositePartyRole: string;
  courtType: string;
  courtName: string;
  caseNumber?: string;
  cnrNumber?: string;
  firNumber?: string;
  policeStation?: string;
  sections?: string;
  stage: string;
  previousDate?: string;
  nextDate?: string;
  remarks?: string;
  nextAction?: string;
  createdAt: string;
}

export interface CaseDraftLink {
  id: string;
  caseId: string;
  draftId: string;
  draftTitle: string;
  status: "started" | "intake_in_progress" | "generated";
  createdAt: string;
  updatedAt?: string;
}

const STORAGE_KEY = "delegatlabs_cases";
const SCHEMA_VERSION_KEY = "delegatlabs_storage_schema_version";
const CURRENT_SCHEMA_VERSION = "2";

export const CASE_ROLE_SUGGESTIONS: Record<string, { firstRole: string; secondRole: string }> = {
  Civil: { firstRole: "Plaintiff", secondRole: "Defendant" },
  Writ: { firstRole: "Petitioner", secondRole: "Respondent" },
  Rent: { firstRole: "Landlord", secondRole: "Tenant" },
  Criminal: { firstRole: "Complainant", secondRole: "Accused" },
  Bail: { firstRole: "Applicant", secondRole: "State" },
  Appeal: { firstRole: "Appellant", secondRole: "Respondent" },
  Consumer: { firstRole: "Complainant", secondRole: "Opposite Party" },
  Application: { firstRole: "Applicant", secondRole: "Opposite Party" },
  Family: { firstRole: "Petitioner", secondRole: "Respondent" },
  Other: { firstRole: "First Party", secondRole: "Second Party" }
};

// --- Case Normalizer & Migration ---

export const normalizeCaseRecord = (data: any): CaseRecord | null => {
  if (!data || typeof data !== "object") return null;
  
  const id = String(data.id || "").trim();
  const caseTitle = String(data.caseTitle || "").trim();
  if (!id || !caseTitle) return null;

  const clientParty = data.clientParty === "partyA" || data.clientParty === "partyB" 
    ? data.clientParty 
    : "partyA";

  const clientName = String(data.clientName || data.client_name || "").trim();
  const clientRole = String(data.clientRole || data.client_role || "").trim();

  // Extract from legacy parties array if needed
  const partiesArray = Array.isArray(data.parties) ? data.parties : [];
  
  const partyA = {
    name: String(
      data.partyA?.name || 
      partiesArray.find((p: any) => p && p.sideLabel === "A")?.partyName || 
      (clientParty === "partyA" ? clientName : "") || 
      ""
    ).trim(),
    legalRole: String(
      data.partyA?.legalRole || 
      partiesArray.find((p: any) => p && p.sideLabel === "A")?.legalRole || 
      (clientParty === "partyA" ? clientRole : "") || 
      "First Party"
    ).trim()
  };

  const partyB = {
    name: String(
      data.partyB?.name || 
      partiesArray.find((p: any) => p && p.sideLabel === "B")?.partyName || 
      (clientParty === "partyB" ? clientName : "") || 
      ""
    ).trim(),
    legalRole: String(
      data.partyB?.legalRole || 
      partiesArray.find((p: any) => p && p.sideLabel === "B")?.legalRole || 
      (clientParty === "partyB" ? clientRole : "") || 
      "Second Party"
    ).trim()
  };

  return {
    id,
    caseTitle,
    caseType: String(data.caseType || "Other").trim(),
    courtType: String(data.courtType || "District Court").trim(),
    courtName: String(data.courtName || "Magistrate Court").trim(),
    courtNumber: data.courtNumber ? String(data.courtNumber).trim() : undefined,
    caseNumber: data.caseNumber ? String(data.caseNumber).trim() : undefined,
    cnrNumber: data.cnrNumber ? String(data.cnrNumber).trim() : undefined,
    firNumber: data.firNumber ? String(data.firNumber).trim() : undefined,
    policeStation: data.policeStation ? String(data.policeStation).trim() : undefined,
    sections: data.sections ? String(data.sections).trim() : undefined,
    stage: String(data.stage || "Admission").trim(),
    remarks: data.remarks ? String(data.remarks).trim() : undefined,
    previousDate: data.previousDate ? String(data.previousDate).trim() : undefined,
    nextDate: data.nextDate ? String(data.nextDate).trim() : undefined,
    fof: data.fof ? String(data.fof).trim() : undefined,
    nextAction: data.nextAction ? String(data.nextAction).trim() : undefined,
    rawNotes: data.rawNotes ? String(data.rawNotes).trim() : undefined,
    partyA,
    partyB,
    clientParty,
    clientRole: clientRole || (clientParty === "partyA" ? partyA.legalRole : partyB.legalRole),
    clientName: clientName || (clientParty === "partyA" ? partyA.name : partyB.name),
    status: data.status === "archived" ? "archived" : "active",
    createdAt: data.createdAt ? String(data.createdAt).trim() : new Date().toISOString(),
    updatedAt: data.updatedAt ? String(data.updatedAt).trim() : undefined
  };
};

export const runStorageMigration = () => {
  if (typeof window === "undefined") return;
  try {
    const activeVersion = localStorage.getItem(SCHEMA_VERSION_KEY);
    if (activeVersion === CURRENT_SCHEMA_VERSION) {
      return; // Already migrated
    }

    // Migrate cases list
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const normalized = parsed
          .map((c) => normalizeCaseRecord(c))
          .filter((c): c is CaseRecord => c !== null);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      }
    }

    localStorage.setItem(SCHEMA_VERSION_KEY, CURRENT_SCHEMA_VERSION);
    console.log("Storage schema migrated to version", CURRENT_SCHEMA_VERSION);
  } catch (error) {
    console.error("Failed to run storage migration", error);
  }
};

// --- Case Storage Helpers ---

export const getActiveCases = (): CaseRecord[] => {
  if (typeof window === "undefined") return [];
  try {
    runStorageMigration();
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    
    return parsed
      .map((c) => normalizeCaseRecord(c))
      .filter((c): c is CaseRecord => c !== null);
  } catch (error) {
    console.error("Failed to load active cases", error);
    return [];
  }
};

export const saveActiveCase = (caseData: Omit<CaseRecord, "id" | "createdAt" | "status">): CaseRecord => {
  const cases = getActiveCases();
  const newCase: CaseRecord = {
    ...caseData,
    id: `case_${Math.random().toString(36).substr(2, 9)}`,
    status: "active",
    createdAt: new Date().toISOString()
  };
  cases.push(newCase);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
      
      // Auto-create case created timeline event
      addCaseTimelineEvent(newCase.id, {
        eventType: "Other",
        eventDate: newCase.createdAt.split("T")[0],
        title: "Case Created",
        description: "Case details initialized in the system."
      });
    } catch (error) {
      console.error("Failed to save active case", error);
    }
  }
  return newCase;
};

export const getActiveCase = (caseId: string): CaseRecord | null => {
  const cases = getActiveCases();
  return cases.find(c => c.id === caseId) || null;
};

export const updateActiveCase = (caseId: string, updates: Partial<Omit<CaseRecord, "id" | "createdAt">>): CaseRecord | null => {
  const cases = getActiveCases();
  const index = cases.findIndex(c => c.id === caseId);
  if (index === -1) return null;

  const updatedCase: CaseRecord = {
    ...cases[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  cases[index] = updatedCase;

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
      
      // Auto-create case updated timeline event
      addCaseTimelineEvent(caseId, {
        eventType: "Other",
        eventDate: new Date().toISOString().split("T")[0],
        title: "Case Updated",
        description: "Case details updated."
      });
    } catch (error) {
      console.error("Failed to update case", error);
    }
  }
  return updatedCase;
};

export const archiveActiveCase = (caseId: string, shouldArchive = true): CaseRecord | null => {
  const updated = updateActiveCase(caseId, { status: shouldArchive ? "archived" : "active" });
  if (updated) {
    // Auto-create case archived/restored timeline event
    addCaseTimelineEvent(caseId, {
      eventType: "Other",
      eventDate: new Date().toISOString().split("T")[0],
      title: shouldArchive ? "Case Archived" : "Case Restored",
      description: shouldArchive ? "Case status updated to archived." : "Case status restored to active."
    });
  }
  return updated;
};

export const deleteActiveCase = (caseId: string): boolean => {
  const cases = getActiveCases();
  const filtered = cases.filter(c => c.id !== caseId);
  if (cases.length === filtered.length) return false;

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      
      // Clean up timeline events and links for deleted case
      localStorage.removeItem(`delegatlabs_case_timeline_${caseId}`);
      
      const rawLinks = localStorage.getItem(LINKS_KEY);
      if (rawLinks) {
        const allLinks: CaseDraftLink[] = JSON.parse(rawLinks);
        const filteredLinks = allLinks.filter(l => l.caseId !== caseId);
        localStorage.setItem(LINKS_KEY, JSON.stringify(filteredLinks));
      }
      return true;
    } catch (error) {
      console.error("Failed to delete case", error);
      return false;
    }
  }
  return false;
};

// --- Timeline Storage Helpers ---

const getTimelineKey = (caseId: string) => `delegatlabs_case_timeline_${caseId}`;

export const getCaseTimeline = (caseId: string): TimelineEvent[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getTimelineKey(caseId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((e: any) => e && typeof e === "object" && e.id && e.caseId === caseId);
  } catch (error) {
    console.error("Failed to load case timeline", error);
    return [];
  }
};

export const addCaseTimelineEvent = (
  caseId: string, 
  event: Omit<TimelineEvent, "id" | "caseId" | "createdAt">
): TimelineEvent => {
  const timeline = getCaseTimeline(caseId);
  const newEvent: TimelineEvent = {
    ...event,
    id: `evt_${Math.random().toString(36).substr(2, 9)}`,
    caseId,
    createdAt: new Date().toISOString()
  };
  timeline.push(newEvent);
  
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(getTimelineKey(caseId), JSON.stringify(timeline));
    } catch (error) {
      console.error("Failed to save timeline event", error);
    }
  }
  return newEvent;
};

export const updateCaseTimelineEvent = (
  caseId: string, 
  eventId: string, 
  updates: Partial<Omit<TimelineEvent, "id" | "caseId" | "createdAt">>
): TimelineEvent | null => {
  const timeline = getCaseTimeline(caseId);
  const index = timeline.findIndex(e => e.id === eventId);
  if (index === -1) return null;

  const updatedEvent: TimelineEvent = {
    ...timeline[index],
    ...updates
  };
  timeline[index] = updatedEvent;

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(getTimelineKey(caseId), JSON.stringify(timeline));
    } catch (error) {
      console.error("Failed to update timeline event", error);
    }
  }
  return updatedEvent;
};

export const deleteCaseTimelineEvent = (caseId: string, eventId: string): boolean => {
  const timeline = getCaseTimeline(caseId);
  const filtered = timeline.filter(e => e.id !== eventId);
  if (timeline.length === filtered.length) return false;

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(getTimelineKey(caseId), JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error("Failed to delete timeline event", error);
      return false;
    }
  }
  return false;
};

// --- Case Draft Context Storage Helpers ---

const CONTEXT_KEY = "delegatlabs_active_case_draft_context";

export const saveActiveCaseDraftContext = (context: CaseDraftContext) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(CONTEXT_KEY, JSON.stringify(context));
  }
};

export const getActiveCaseDraftContext = (): CaseDraftContext | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONTEXT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !parsed.caseId || !parsed.draftId) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const clearActiveCaseDraftContext = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(CONTEXT_KEY);
  }
};

// --- Case Draft Links Storage Helpers ---

const LINKS_KEY = "delegatlabs_case_draft_links";

export const getCaseDraftLinks = (caseId: string): CaseDraftLink[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LINKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((l: any) => l && typeof l === "object" && l.caseId === caseId);
  } catch {
    return [];
  }
};

export const saveCaseDraftLink = (link: Omit<CaseDraftLink, "id" | "createdAt">): CaseDraftLink => {
  if (typeof window === "undefined") {
    return { ...link, id: "", createdAt: new Date().toISOString() };
  }
  const raw = localStorage.getItem(LINKS_KEY);
  const allLinks: CaseDraftLink[] = raw ? JSON.parse(raw) : [];
  
  const newLink: CaseDraftLink = {
    ...link,
    id: `link_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString()
  };
  
  allLinks.push(newLink);
  localStorage.setItem(LINKS_KEY, JSON.stringify(allLinks));
  return newLink;
};

export const updateCaseDraftLink = (
  caseId: string,
  draftId: string,
  updates: Partial<Omit<CaseDraftLink, "id" | "caseId" | "draftId" | "createdAt">>
): CaseDraftLink | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(LINKS_KEY);
  if (!raw) return null;
  
  try {
    const allLinks: CaseDraftLink[] = JSON.parse(raw);
    if (!Array.isArray(allLinks)) return null;
    
    const index = allLinks.findIndex(l => l.caseId === caseId && l.draftId === draftId);
    if (index === -1) return null;
    
    const updatedLink: CaseDraftLink = {
      ...allLinks[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    allLinks[index] = updatedLink;
    localStorage.setItem(LINKS_KEY, JSON.stringify(allLinks));
    return updatedLink;
  } catch {
    return null;
  }
};
