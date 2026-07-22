"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSelectedLanguage } from "../../../lib/storage";
import { getTranslation, Language } from "../../../lib/i18n";
import { saveActiveCase, CASE_ROLE_SUGGESTIONS } from "../../../lib/case-storage";
import AppHeader from "../../../components/app-header";
import { ArrowLeft, Save, Scale, User, Calendar, BookOpen, AlertCircle } from "lucide-react";

export default function AddCasePage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>("en");
  const [isClient, setIsClient] = useState(false);
  const [showError, setShowError] = useState(false);

  // Form Fields
  const [caseTitle, setCaseTitle] = useState("");
  const [caseType, setCaseType] = useState("Rent");
  const [caseNumber, setCaseNumber] = useState("");
  const [cnrNumber, setCnrNumber] = useState("");
  const [firNumber, setFirNumber] = useState("");
  const [policeStation, setPoliceStation] = useState("");
  const [sections, setSections] = useState("");
  
  // Court Details
  const [courtType, setCourtType] = useState("Rent Control Authority");
  const [courtName, setCourtName] = useState("");
  const [courtNumber, setCourtNumber] = useState("");

  // Dates & Stage
  const [stage, setStage] = useState("Final Arguments");
  const [previousDate, setPreviousDate] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [fof, setFof] = useState("");
  const [nextAction, setNextAction] = useState("");

  // Parties Setup
  const [partyAName, setPartyAName] = useState("");
  const [partyARole, setPartyARole] = useState("Landlord");
  const [partyBName, setPartyBName] = useState("");
  const [partyBRole, setPartyBRole] = useState("Tenant");
  const [clientSide, setClientSide] = useState<"partyA" | "partyB" | "">("");

  // Notes
  const [rawNotes, setRawNotes] = useState("");

  useEffect(() => {
    setLang(getSelectedLanguage("en"));
    setIsClient(true);
  }, []);

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
  };

  // Auto-fill roles on Case Type change
  const handleCaseTypeChange = (newType: string) => {
    setCaseType(newType);
    const suggestion = CASE_ROLE_SUGGESTIONS[newType];
    if (suggestion) {
      setPartyARole(suggestion.firstRole);
      setPartyBRole(suggestion.secondRole);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Required fields verification
    const isValid = 
      caseTitle.trim() !== "" &&
      caseType.trim() !== "" &&
      partyAName.trim() !== "" &&
      partyARole.trim() !== "" &&
      partyBName.trim() !== "" &&
      partyBRole.trim() !== "" &&
      clientSide !== "" &&
      courtType.trim() !== "" &&
      stage.trim() !== "" &&
      nextDate.trim() !== "";

    if (!isValid) {
      setShowError(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setShowError(false);

    const clientName = clientSide === "partyA" ? partyAName : partyBName;
    const clientRole = clientSide === "partyA" ? partyARole : partyBRole;

    const saved = saveActiveCase({
      caseTitle,
      caseType,
      courtType,
      courtName: courtName || "Ld. Court",
      courtNumber,
      caseNumber,
      cnrNumber,
      firNumber,
      policeStation,
      sections,
      stage,
      previousDate,
      nextDate,
      fof,
      nextAction,
      rawNotes,
      partyA: {
        name: partyAName,
        legalRole: partyARole
      },
      partyB: {
        name: partyBName,
        legalRole: partyBRole
      },
      clientParty: clientSide,
      clientRole,
      clientName
    });

    router.push(`/cases/${saved.id}`);
  };

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        <div className="animate-pulse">Loading / लोड हो रहा है...</div>
      </div>
    );
  }

  const t = getTranslation(lang);

  const caseTypesList = [
    "Civil", "Criminal", "Family", "Rent", "Consumer", 
    "Appeal", "Writ", "Bail", "Application", "Other"
  ];

  const courtTypes = [
    "High Court", "District Court", "Lower Court", "Civil Court", 
    "Criminal Court", "Family Court", "Tribunal", "Rent Control Authority", 
    "Consumer Forum", "Other"
  ];

  const showCriminalInfo = caseType === "Criminal" || caseType === "Bail";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <AppHeader currentLang={lang} onLanguageChange={handleLanguageChange} />

      {/* Main Container */}
      <main className="flex-grow max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Back Link */}
        <button
          onClick={() => router.push("/cases")}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{lang === "hi" ? "मामलों की सूची पर वापस जाएं" : "Back to Cases List"}</span>
        </button>

        {/* Heading */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t.add_active_case}
          </h1>
          <p className="text-xs text-slate-500">
            {lang === "hi" ? "नया सक्रिय मुकदमा जोड़ने के लिए विवरण भरें।" : "Fill details to save a new active lawsuit."}
          </p>
        </div>

        {/* Error alert banner */}
        {showError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-3 text-red-800 text-xs font-semibold shadow-sm animate-shake">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <div className="space-y-0.5">
              <span className="block font-bold">
                {lang === "hi" ? "सत्यापन त्रुटि" : "Validation Error"}
              </span>
              <span className="block opacity-90">
                {lang === "hi" ? "कृपया सहेजने से पहले आवश्यक फ़ील्ड भरें।" : "Please complete required fields before saving."}
              </span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-8 pb-12">
          
          {/* Section 1: Basic Case Details */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-2.5">
              <Scale className="h-4 w-4 text-slate-400" />
              <span>{lang === "hi" ? "मूल मुकदमा विवरण" : "Basic Case Details"}</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {t.case_title} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder={lang === "hi" ? "जैसे: मोहम्मद ज़ीशान बनाम महेंद्र गुड्डू" : "e.g. Mohd Zeeshan vs Mahendra Guddu"}
                  value={caseTitle}
                  onChange={(e) => setCaseTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {t.case_type} <span className="text-red-500">*</span>
                </label>
                <select
                  value={caseType}
                  onChange={(e) => handleCaseTypeChange(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 text-xs sm:text-sm bg-white"
                >
                  {caseTypesList.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {t.case_number}
                </label>
                <input
                  type="text"
                  placeholder="e.g. RC/250/2026"
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {t.cnr_number}
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPRP010001232026"
                  value={cnrNumber}
                  onChange={(e) => setCnrNumber(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 text-xs sm:text-sm font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Party Setup */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-2.5">
              <User className="h-4 w-4 text-slate-400" />
              <span>{lang === "hi" ? "पक्षकार सेटअप" : "Party Setup"}</span>
            </h3>

            <div className="space-y-6">
              {/* First Party */}
              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 space-y-3">
                <span className="block text-[10px] font-extrabold tracking-wider uppercase text-slate-400">
                  {lang === "hi" ? "प्रथम पक्षकार" : "First Party"}
                </span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mohd Zeeshan"
                      value={partyAName}
                      onChange={(e) => setPartyAName(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 text-xs sm:text-sm bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">
                      Legal Role <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={partyARole}
                      onChange={(e) => setPartyARole(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 text-xs sm:text-sm bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Second Party */}
              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 space-y-3">
                <span className="block text-[10px] font-extrabold tracking-wider uppercase text-slate-400">
                  {lang === "hi" ? "द्वितीय पक्षकार" : "Second Party"}
                </span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mahendra Guddu"
                      value={partyBName}
                      onChange={(e) => setPartyBName(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 text-xs sm:text-sm bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">
                      Legal Role <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={partyBRole}
                      onChange={(e) => setPartyBRole(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 text-xs sm:text-sm bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Client Selector (Role-based labels) */}
              <div className="flex flex-col space-y-2 pt-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {lang === "hi" ? "हमारा मुवक्किल कौन है? *" : "Our client is: *"}
                </label>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition min-w-[200px]">
                    <input
                      type="radio"
                      name="clientSide"
                      checked={clientSide === "partyA"}
                      onChange={() => setClientSide("partyA")}
                      className="text-slate-900 focus:ring-slate-800 h-4 w-4"
                    />
                    <div className="flex flex-col pl-1">
                      <span className="font-bold text-slate-800">{partyARole || "First Party Role"}</span>
                      <span className="text-[9px] text-slate-400 font-medium">({partyAName || "First Party Name"})</span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition min-w-[200px]">
                    <input
                      type="radio"
                      name="clientSide"
                      checked={clientSide === "partyB"}
                      onChange={() => setClientSide("partyB")}
                      className="text-slate-900 focus:ring-slate-800 h-4 w-4"
                    />
                    <div className="flex flex-col pl-1">
                      <span className="font-bold text-slate-800">{partyBRole || "Second Party Role"}</span>
                      <span className="text-[9px] text-slate-400 font-medium">({partyBName || "Second Party Name"})</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Court Details */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-2.5">
              <Scale className="h-4 w-4 text-slate-400" />
              <span>{lang === "hi" ? "अदालत विवरण" : "Court Details"}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {t.court_type} <span className="text-red-500">*</span>
                </label>
                <select
                  value={courtType}
                  onChange={(e) => setCourtType(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 text-xs sm:text-sm bg-white"
                >
                  {courtTypes.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {t.court_name}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Allahabad High Court, Lucknow Bench"
                  value={courtName}
                  onChange={(e) => setCourtName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {t.court_room}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Court Room No. 5"
                  value={courtNumber}
                  onChange={(e) => setCourtNumber(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Criminal Details (conditional) */}
          {showCriminalInfo && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 animate-fade-in">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-2.5">
                <Scale className="h-4 w-4 text-slate-400" />
                <span>{lang === "hi" ? "आपराधिक मामला विवरण" : "Criminal Details"}</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {t.fir_number}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 102/2026"
                    value={firNumber}
                    onChange={(e) => setFirNumber(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {t.police_station}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hazratganj"
                    value={policeStation}
                    onChange={(e) => setPoliceStation(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {t.sections_u_s}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sec 379 IPC / Sec 303 BNS"
                    value={sections}
                    onChange={(e) => setSections(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 text-xs sm:text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Dates & Stage */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-2.5">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span>{lang === "hi" ? "तारीख और सुनवाई की स्थिति" : "Dates & Stage"}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {t.stage} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hearing on Admission"
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {t.previous_date}
                </label>
                <input
                  type="date"
                  value={previousDate}
                  onChange={(e) => setPreviousDate(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 text-xs sm:text-sm bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {t.next_date} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 text-xs sm:text-sm bg-white"
                />
              </div>

              <div className="space-y-1 md:col-span-3">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {t.fof_label}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Next date fixed for written arguments submissions"
                  value={fof}
                  onChange={(e) => setFof(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1 md:col-span-3">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {t.next_action}
                </label>
                <input
                  type="text"
                  placeholder="e.g. File Supplementary Affidavit"
                  value={nextAction}
                  onChange={(e) => setNextAction(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section 6: Notes */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-2.5">
              <BookOpen className="h-4 w-4 text-slate-400" />
              <span>{lang === "hi" ? "कच्चे नोट" : "Notes"}</span>
            </h3>
            
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {t.raw_notes}
              </label>
              <textarea
                rows={4}
                placeholder={lang === "hi" ? "मुकदमे के बारे में अतिरिक्त टिप्पणी या तथ्य दर्ज करें..." : "Enter hearing briefs, deponent remarks, or arguments parameters..."}
                value={rawNotes}
                onChange={(e) => setRawNotes(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 text-xs sm:text-sm resize-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end">
            <button
              type="submit"
              className="inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition shadow shadow-slate-950/20 active:scale-98"
            >
              <Save className="h-4 w-4" />
              <span>{lang === "hi" ? "मामला सहेजें" : "Save Case"}</span>
            </button>
          </div>

        </form>
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        <p>© 2026 DelegatLabs. Custom Legal Drafting Engine for Advocates.</p>
      </footer>
    </div>
  );
}
