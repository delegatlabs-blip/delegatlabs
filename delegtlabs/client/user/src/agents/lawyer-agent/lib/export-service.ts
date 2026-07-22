export interface ExportServiceResponse {
  status: "coming_soon" | "success" | "error";
  message: string;
}

export const printDraft = (): void => {
  if (typeof window !== "undefined") {
    window.print();
  }
};

export const exportDocxComingSoon = async (): Promise<ExportServiceResponse> => {
  return {
    status: "coming_soon",
    message: "DOCX export will be added in backend export service."
  };
};

export const exportPdfComingSoon = async (): Promise<ExportServiceResponse> => {
  return {
    status: "coming_soon",
    message: "PDF export will be added in backend export service."
  };
};
