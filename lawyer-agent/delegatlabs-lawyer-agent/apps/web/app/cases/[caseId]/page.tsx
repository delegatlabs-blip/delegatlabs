"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getSelectedLanguage } from "../../../lib/storage";
import { getTranslation, Language } from "../../../lib/i18n";
import { 
  getActiveCase, 
  archiveActiveCase, 
  deleteActiveCase, 
  getCaseTimeline, 
  addCaseTimelineEvent, 
  updateCaseTimelineEvent, 
  deleteCaseTimelineEvent, 
  getCaseDraftLinks,
  CaseRecord, 
  TimelineEvent,
  CaseDraftLink
} from "../../../lib/case-storage";
import { getCaseDraftSuggestions, runSuggestionsTests } from "../../../lib/case-draft-suggestions";
import AppHeader from "../../../components/app-header";
import { 
  ArrowLeft, Scale, User, Calendar, BookOpen, AlertCircle, 
  FileText, Plus, Edit2, Archive, Trash2, RefreshCw, Clock, X, ExternalLink 
} from "lucide-react";

// Modal Component for adding/editing timeline events
interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (type: any, date: string, title: string, desc: string) => void;
  initialData: TimelineEvent | null;
  lang: Language;
}

function EventModal({ isOpen, onClose, onSubmit, initialData, lang }: EventModalProps) {
  const [eventType, setEventType] = useState<TimelineEvent["eventType"]>("Hearing");
  const [eventDate, setEventDate] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const t = getTranslation(lang);

  useEffect(() => {
    if (initialData) {
      setEventType(initialData.eventType);
      setEventDate(initialData.eventDate);
      setTitle(initialData.title);
      setDescription(initialData.description);
    } else {
      setEventType("Hearing");
      setEventDate(new Date().toISOString().split("T")[0]);
      setTitle("");
      setDescription("");
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const eventTypes: TimelineEvent["eventType"][] = [
    "Hearing", "Filing", "Order", "Draft Prepared", "Client Follow-up", "Note", "Other"
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4 animate-scale-up relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-sm font-bold text-slate-800 tracking-tight">
          {initialData ? t.edit_timeline_entry : t.add_timeline_entry}
        </h3>

        <div className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="block font-bold text-slate-500 uppercase tracking-wider">{t.event_type}</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 bg-white"
            >
              {eventTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block font-bold text-slate-500 uppercase tracking-wider">{t.event_date}</label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-bold text-slate-500 uppercase tracking-wider">{t.event_title}</label>
            <input
              type="text"
              placeholder={lang === "hi" ? "शीर्षक दर्ज करें" : "Enter event title"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-bold text-slate-500 uppercase tracking-wider">{t.event_desc}</label>
            <textarea
              rows={3}
              placeholder={lang === "hi" ? "विवरण दर्ज करें" : "Enter event description"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 font-bold text-xs hover:bg-slate-50 transition"
          >
            {lang === "hi" ? "रद्द करें" : "Cancel"}
          </button>
          <button
            onClick={() => onSubmit(eventType, eventDate, title, description)}
            disabled={!title.trim()}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition"
          >
            {lang === "hi" ? "सहेजें" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CaseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const caseId = params.caseId as string;

  const [lang, setLang] = useState<Language>("en");
  const [caseRecord, setCaseRecord] = useState<CaseRecord | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [draftLinks, setDraftLinks] = useState<CaseDraftLink[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);

  useEffect(() => {
    setLang(getSelectedLanguage("en"));
    setCaseRecord(getActiveCase(caseId));
    setTimeline(getCaseTimeline(caseId));
    setDraftLinks(getCaseDraftLinks(caseId));
    
    // Execute diagnostic suggestions checks
    if (process.env.NODE_ENV === "development") {
      const checks = runSuggestionsTests();
      console.log("Diagnostic suggestions check result:", checks);
    }
    
    setIsClient(true);
  }, [caseId]);

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
  };

  const handleArchiveToggle = () => {
    if (!caseRecord) return;
    const isArchived = caseRecord.status === "archived";
    archiveActiveCase(caseId, !isArchived);
    router.push("/cases");
  };

  const handleDelete = () => {
    if (!caseRecord) return;
    const tMsg = getTranslation(lang);
    const confirmed = window.confirm(tMsg.delete_confirm);
    if (confirmed) {
      deleteActiveCase(caseId);
      router.push("/cases");
    }
  };

  // Add/Edit Event Submission
  const handleModalSubmit = (type: any, date: string, title: string, desc: string) => {
    if (editingEvent) {
      updateCaseTimelineEvent(caseId, editingEvent.id, {
        eventType: type,
        eventDate: date,
        title,
        description: desc
      });
    } else {
      addCaseTimelineEvent(caseId, {
        eventType: type,
        eventDate: date,
        title,
        description: desc
      });
    }
    // Refresh
    setTimeline(getCaseTimeline(caseId));
    setIsModalOpen(false);
    setEditingEvent(null);
  };

  const handleDeleteEvent = (eventId: string) => {
    const tMsg = getTranslation(lang);
    const confirmed = window.confirm(tMsg.delete_event_confirm);
    if (confirmed) {
      deleteCaseTimelineEvent(caseId, eventId);
      setTimeline(getCaseTimeline(caseId));
    }
  };

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        <div className="animate-pulse">Loading / लोड हो रहा है...</div>
      </div>
    );
  }

  const t = getTranslation(lang);

  if (!caseRecord) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <AlertCircle className="h-10 w-10 text-slate-400" />
        <p className="text-slate-600 font-semibold">
          {lang === "hi" ? "मामला नहीं मिला।" : "Case record not found."}
        </p>
        <button
          onClick={() => router.push("/cases")}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-xs"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Backward compatibility logic mapping for legacy Level 15 cases
  const partyA = caseRecord.partyA || {
    name: (caseRecord as any).parties?.find((p: any) => p.sideLabel === "A")?.partyName || "",
    legalRole: (caseRecord as any).parties?.find((p: any) => p.sideLabel === "A")?.legalRole || ""
  };
  const partyB = caseRecord.partyB || {
    name: (caseRecord as any).parties?.find((p: any) => p.sideLabel === "B")?.partyName || "",
    legalRole: (caseRecord as any).parties?.find((p: any) => p.sideLabel === "B")?.legalRole || ""
  };

  const showCriminalInfo = caseRecord.caseType === "Criminal" || caseRecord.caseType === "Bail";
  const isArchived = caseRecord.status === "archived";

  // Days remaining calculation
  let daysRemaining: number | null = null;
  let hasPassed = false;
  if (caseRecord.nextDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(caseRecord.nextDate);
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - today.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (daysRemaining < 0) {
      hasPassed = true;
    }
  }

  // Sorted timeline feed (newest eventDate first, or createdAt fallback)
  const sortedTimeline = [...timeline].sort((a, b) => {
    const diff = new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();
    if (diff !== 0) return diff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Styled colors helper for event types
  const getEventBadgeClass = (type: TimelineEvent["eventType"]) => {
    switch (type) {
      case "Hearing":
        return "bg-sky-50 border-sky-100 text-sky-700";
      case "Filing":
        return "bg-purple-50 border-purple-100 text-purple-700";
      case "Order":
        return "bg-emerald-50 border-emerald-100 text-emerald-700";
      case "Draft Prepared":
        return "bg-orange-50 border-orange-100 text-orange-700";
      case "Client Follow-up":
        return "bg-amber-50 border-amber-100 text-amber-700";
      case "Note":
        return "bg-slate-100 border-slate-200 text-slate-700";
      default:
        return "bg-slate-50 border-slate-100 text-slate-600";
    }
  };

  // Maps link status labels
  const getLinkStatusClass = (status: CaseDraftLink["status"]) => {
    switch (status) {
      case "generated":
        return "bg-green-50 text-green-700 border-green-200";
      case "intake_in_progress":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <AppHeader currentLang={lang} onLanguageChange={handleLanguageChange} />

      {/* Main Container */}
      <main className="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Navigation back and active buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            onClick={() => router.push("/cases")}
            className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{lang === "hi" ? "मामलों की सूची पर वापस जाएं" : "Back to Cases List"}</span>
          </button>

          {/* Edit / Archive / Delete Toolbar */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => router.push(`/cases/${caseId}/edit`)}
              className="flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition"
            >
              <Edit2 className="h-3.5 w-3.5 text-slate-400" />
              <span>{t.edit_case}</span>
            </button>

            <button
              onClick={handleArchiveToggle}
              className="flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition"
            >
              {isArchived ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
                  <span>{t.restore_case}</span>
                </>
              ) : (
                <>
                  <Archive className="h-3.5 w-3.5 text-slate-400" />
                  <span>{t.archive_case}</span>
                </>
              )}
            </button>

            <button
              onClick={handleDelete}
              className="flex items-center space-x-1.5 px-3 py-1.5 border border-red-200 bg-white hover:bg-red-50 text-red-600 font-bold text-xs rounded-xl transition"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-400" />
              <span>{t.delete_case}</span>
            </button>
          </div>
        </div>

        {/* Case Title Summary Header Card */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="inline-block text-[9px] font-extrabold tracking-wider uppercase bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded">
                  {caseRecord.caseType}
                </span>
                
                {/* Status Badge */}
                {isArchived ? (
                  <span className="inline-block text-[9px] font-extrabold tracking-wider uppercase bg-amber-600/30 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded">
                    {t.archived}
                  </span>
                ) : (
                  <span className="inline-block text-[9px] font-extrabold tracking-wider uppercase bg-green-600/30 text-green-300 border border-green-500/30 px-2.5 py-0.5 rounded">
                    {t.active}
                  </span>
                )}
              </div>
              
              <h1 className="text-xl font-bold tracking-tight">{caseRecord.caseTitle}</h1>
              {caseRecord.cnrNumber && (
                <span className="block text-[10px] font-mono text-slate-400">
                  CNR: {caseRecord.cnrNumber}
                </span>
              )}
            </div>

            <button
              onClick={() => router.push(`/cases/${caseId}/drafts/new`)}
              className="inline-flex items-center justify-center space-x-1.5 px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs rounded-xl transition shadow active:scale-98"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{lang === "hi" ? "इस मामले से मसौदा बनाएं" : "Create Draft From This Case"}</span>
            </button>
          </div>

          {/* Header Summary Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold">
            <div className="space-y-0.5">
              <span className="block text-[9px] text-slate-400 uppercase tracking-wider">{t.client_name}</span>
              <span className="block text-slate-200">{caseRecord.clientName || partyA.name}</span>
            </div>
            
            <div className="space-y-0.5">
              <span className="block text-[9px] text-slate-400 uppercase tracking-wider">Client Role</span>
              <span className="block text-slate-200">{caseRecord.clientRole || partyA.legalRole}</span>
            </div>

            <div className="space-y-0.5">
              <span className="block text-[9px] text-slate-400 uppercase tracking-wider">{t.stage}</span>
              <span className="block text-slate-200">{caseRecord.stage}</span>
            </div>

            <div className="space-y-0.5">
              <span className="block text-[9px] text-slate-400 uppercase tracking-wider">{t.next_date}</span>
              <span className="block text-slate-200">{caseRecord.nextDate || "Not Fixed"}</span>
            </div>
          </div>
        </div>

        {/* Info grids split */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Left Columns (details) */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Parties Section */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-2.5">
                <User className="h-4 w-4 text-slate-400" />
                <span>{lang === "hi" ? "पक्षकार सेटअप" : "Party Setup"}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* First Party */}
                <div className="space-y-2">
                  <span className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                    {lang === "hi" ? "प्रथम पक्षकार" : "First Party"}
                  </span>
                  
                  <div className={`p-3 rounded-xl border text-xs font-semibold ${
                    caseRecord.clientParty === "partyA" 
                      ? "bg-slate-900 border-slate-900 text-white shadow-sm" 
                      : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}>
                    <span className="block font-bold">{partyA.name}</span>
                    <span className="block text-[10px] opacity-75 mt-0.5">{partyA.legalRole}</span>
                    {caseRecord.clientParty === "partyA" && (
                      <span className="inline-block mt-2 text-[8px] font-extrabold tracking-wider uppercase bg-white text-slate-900 px-1.5 py-0.5 rounded">
                        {lang === "hi" ? "हमारा मुवक्किल" : "Our Client"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Second Party */}
                <div className="space-y-2">
                  <span className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                    {lang === "hi" ? "द्वितीय पक्षकार" : "Second Party"}
                  </span>

                  <div className={`p-3 rounded-xl border text-xs font-semibold ${
                    caseRecord.clientParty === "partyB" 
                      ? "bg-slate-900 border-slate-900 text-white shadow-sm" 
                      : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}>
                    <span className="block font-bold">{partyB.name}</span>
                    <span className="block text-[10px] opacity-75 mt-0.5">{partyB.legalRole}</span>
                    {caseRecord.clientParty === "partyB" && (
                      <span className="inline-block mt-2 text-[8px] font-extrabold tracking-wider uppercase bg-white text-slate-900 px-1.5 py-0.5 rounded">
                        {lang === "hi" ? "हमारा मुवक्किल" : "Our Client"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Litigation Forums Details */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-2.5">
                <Scale className="h-4 w-4 text-slate-400" />
                <span>{lang === "hi" ? "अदालत और मुकदमा विवरण" : "Court & Case Details"}</span>
              </h3>

              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase">Court Type</span>
                  <span className="block text-slate-800 mt-0.5">{caseRecord.courtType}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase">Court Name</span>
                  <span className="block text-slate-800 mt-0.5">{caseRecord.courtName}</span>
                </div>
                {caseRecord.courtNumber && (
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Court Room / Floor</span>
                    <span className="block text-slate-800 mt-0.5">{caseRecord.courtNumber}</span>
                  </div>
                )}
                {caseRecord.caseNumber && (
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Case Number</span>
                    <span className="block text-slate-800 mt-0.5">{caseRecord.caseNumber}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Criminal Details (gated conditional) */}
            {showCriminalInfo && (caseRecord.firNumber || caseRecord.policeStation || caseRecord.sections) && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-2.5">
                  <Scale className="h-4 w-4 text-slate-400" />
                  <span>{lang === "hi" ? "आपारीरिक मामला विवरण" : "Criminal Details"}</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-semibold">
                  {caseRecord.firNumber && (
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase">FIR Number</span>
                      <span className="block text-slate-800 mt-0.5">{caseRecord.firNumber}</span>
                    </div>
                  )}
                  {caseRecord.policeStation && (
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase">Police Station</span>
                      <span className="block text-slate-800 mt-0.5">{caseRecord.policeStation}</span>
                    </div>
                  )}
                  {caseRecord.sections && (
                    <div className="col-span-2 sm:col-span-1">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase">Sections / U/S</span>
                      <span className="block text-slate-800 mt-0.5">{caseRecord.sections}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes Section */}
            {caseRecord.rawNotes && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-2.5">
                  <BookOpen className="h-4 w-4 text-slate-400" />
                  <span>{lang === "hi" ? "मुकदमा नोट्स" : "Case Notes"}</span>
                </h3>
                <p className="text-xs text-slate-600 font-semibold leading-relaxed whitespace-pre-wrap">
                  {caseRecord.rawNotes}
                </p>
              </div>
            )}

            {/* Suggested Drafts Section (Level 20) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-2.5">
                  <Scale className="h-4 w-4 text-slate-400" />
                  <span>{t.suggested_drafts}</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {t.suggested_drafts_desc}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {getCaseDraftSuggestions(caseRecord)
                  .sort((a, b) => {
                    const priorityWeight = { recommended: 3, relevant: 2, optional: 1 };
                    return priorityWeight[b.priority] - priorityWeight[a.priority];
                  })
                  .slice(0, 4)
                  .map((suggestion) => {
                    const priorityLabel = 
                      suggestion.priority === "recommended" ? t.priority_recommended :
                      suggestion.priority === "relevant" ? t.priority_relevant :
                      t.priority_optional;

                    const priorityColor =
                      suggestion.priority === "recommended" ? "bg-green-50 text-green-700 border-green-200" :
                      suggestion.priority === "relevant" ? "bg-sky-50 text-sky-700 border-sky-200" :
                      "bg-slate-50 text-slate-600 border-slate-200";

                    return (
                      <div 
                        key={suggestion.draftId} 
                        className="p-4 bg-slate-50/50 border border-slate-200 rounded-xl space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between flex-wrap gap-1.5">
                            <span className="font-extrabold text-slate-800 text-xs">
                              {lang === "hi" ? suggestion.titleHi : suggestion.title}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold tracking-wider uppercase border ${priorityColor}`}>
                              {priorityLabel}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                            {lang === "hi" ? suggestion.reasonHi : suggestion.reason}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between">
                          {suggestion.isAvailable ? (
                            <>
                              <span className="text-[9px] font-extrabold tracking-wider uppercase text-green-600">
                                {lang === "hi" ? "उपलब्ध" : "Available"}
                              </span>
                              <button
                                onClick={() => router.push(`/cases/${caseId}/drafts/new`)}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] rounded-lg transition"
                              >
                                {t.start_draft}
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="text-[9px] font-extrabold tracking-wider uppercase text-amber-600">
                                {lang === "hi" ? "जल्द आ रहा है" : "Coming Soon"}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold">
                                {t.coming_soon}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* View All & Safety Footer */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <button
                  onClick={() => router.push(`/cases/${caseId}/drafts/new`)}
                  className="text-xs font-bold text-slate-800 hover:text-slate-950 flex items-center space-x-1"
                >
                  <span>{t.view_all_drafts}</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
                
                <span className="text-[9px] text-slate-400 font-medium max-w-md sm:text-right leading-normal">
                  {t.suggested_drafts_safety}
                </span>
              </div>
            </div>

            {/* Case Linked Drafts */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-2.5">
                <FileText className="h-4 w-4 text-slate-400" />
                <span>{lang === "hi" ? "जुड़े हुए मसौदे" : "Linked Drafts"}</span>
              </h3>
              
              {draftLinks.length === 0 ? (
                <div className="p-5 border border-dashed border-slate-200 bg-slate-50/50 rounded-xl text-center">
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {t.drafts_linked_message}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3.5">
                  {draftLinks.map((link) => (
                    <div 
                      key={link.id} 
                      className="p-4 bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-xl transition flex items-center justify-between text-xs font-semibold gap-3"
                    >
                      <div className="space-y-1">
                        <span className="block font-extrabold text-slate-800">{link.draftTitle}</span>
                        <span className="block text-[9px] text-slate-400">
                          {lang === "hi" ? "बनाया गया: " : "Created: "}{link.createdAt.split("T")[0]}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-3 flex-shrink-0">
                        <span className={`px-2.5 py-0.5 rounded text-[8px] font-extrabold tracking-wider uppercase border ${getLinkStatusClass(link.status)}`}>
                          {link.status}
                        </span>

                        <button
                          onClick={() => router.push(`/drafts/${link.draftId}/plan?caseId=${caseId}`)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] rounded-lg transition"
                        >
                          <span>{lang === "hi" ? "मसौदा खोलें" : "Open Draft"}</span>
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column details (hearings timeline + activities feed) */}
          <div className="space-y-6">
            
            {/* Hearing Timeline overview */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>{lang === "hi" ? "सुनवाई की स्थिति" : "Hearing Timeline"}</span>
              </h3>

              {/* Countdown Warning Banner */}
              {caseRecord.nextDate && (
                <div className={`p-3 rounded-xl border text-xs font-bold flex items-start space-x-2 ${
                  hasPassed
                    ? "bg-red-50 border-red-200 text-red-800"
                    : daysRemaining === 0
                      ? "bg-sky-50 border-sky-200 text-sky-800"
                      : "bg-slate-50 border-slate-200 text-slate-800"
                }`}>
                  <AlertCircle className={`h-4.5 w-4.5 flex-shrink-0 ${hasPassed ? "text-red-500" : "text-slate-400"}`} />
                  <div className="space-y-0.5">
                    {hasPassed ? (
                      <span className="block leading-relaxed">{t.days_passed_warning}</span>
                    ) : daysRemaining === 0 ? (
                      <span className="block font-bold">{lang === "hi" ? "सुनवाई आज है" : "Hearing is today!"}</span>
                    ) : (
                      <span className="block">
                        {daysRemaining} {t.days_remaining}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-4 text-xs font-semibold leading-relaxed">
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase">Current Stage</span>
                  <span className="block text-slate-800 font-bold mt-0.5">{caseRecord.stage}</span>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase">Previous Date</span>
                  <span className="block text-slate-600 mt-0.5">{caseRecord.previousDate || "N/A"}</span>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase">Next Date / Date Fixed</span>
                  <span className="inline-flex items-center space-x-1 font-bold text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 mt-1">
                    <Calendar className="h-3 w-3 text-slate-500" />
                    <span>{caseRecord.nextDate || "Not Fixed"}</span>
                  </span>
                </div>

                {caseRecord.fof && (
                  <div className="pt-3 border-t border-slate-100">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">{t.fof_label}</span>
                    <span className="block text-slate-600 mt-0.5">{caseRecord.fof}</span>
                  </div>
                )}

                {caseRecord.nextAction && (
                  <div className="pt-3 border-t border-slate-100">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">{t.next_action}</span>
                    <span className="block text-slate-850 font-bold mt-0.5">{caseRecord.nextAction}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Case Timeline Events section */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span>{t.timeline}</span>
                </h3>

                <button
                  onClick={() => {
                    setEditingEvent(null);
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center space-x-1 text-[11px] font-bold text-slate-900 hover:text-slate-700 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg transition"
                >
                  <Plus className="h-3 w-3" />
                  <span>{lang === "hi" ? "जोड़ें" : "Add"}</span>
                </button>
              </div>

              {sortedTimeline.length === 0 ? (
                <p className="text-xs text-slate-400 font-semibold py-4 text-center">
                  {t.no_timeline_events}
                </p>
              ) : (
                <div className="space-y-4 relative border-l border-slate-200 pl-4 ml-2.5">
                  {sortedTimeline.map((event) => (
                    <div key={event.id} className="relative space-y-1.5 text-xs">
                      {/* Timeline dot */}
                      <span className="absolute -left-[21.5px] top-1 h-3 w-3 rounded-full border border-slate-200 bg-white" />

                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className={`inline-block text-[8px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded border ${getEventBadgeClass(event.eventType)}`}>
                          {event.eventType}
                        </span>
                        
                        <span className="text-[10px] text-slate-400 font-mono">
                          {event.eventDate}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <h4 className="font-extrabold text-slate-800">{event.title}</h4>
                        {event.description && (
                          <p className="text-slate-500 font-medium leading-relaxed whitespace-pre-wrap">{event.description}</p>
                        )}
                      </div>

                      {/* Event actions (Edit / Delete) */}
                      <div className="flex items-center space-x-2 pt-1 border-t border-slate-50">
                        <button
                          onClick={() => {
                            setEditingEvent(event);
                            setIsModalOpen(true);
                          }}
                          className="text-[10px] font-bold text-slate-400 hover:text-slate-700"
                        >
                          {lang === "hi" ? "संपादित करें" : "Edit"}
                        </button>
                        <span className="text-slate-200">|</span>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="text-[10px] font-bold text-red-400 hover:text-red-700"
                        >
                          {lang === "hi" ? "हटाएं" : "Delete"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Modal component */}
        <EventModal 
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingEvent(null);
          }}
          onSubmit={handleModalSubmit}
          initialData={editingEvent}
          lang={lang}
        />

      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        <p>© 2026 DelegatLabs. Custom Legal Drafting Engine for Advocates.</p>
      </footer>
    </div>
  );
}
