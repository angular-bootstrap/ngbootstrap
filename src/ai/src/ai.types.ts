/** UI data only: applications own model requests, streaming, and persistence. */
export interface NgbAiMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  status?: "complete" | "streaming" | "error";
  error?: string;
}
export interface NgbAiResponse {
  id: string;
  prompt: string;
  text: string;
}
export interface NgbAiFeedback {
  id: string;
  value: "helpful" | "unhelpful" | null;
}
export interface NgbInlineAiRequest {
  instruction: string;
  context: string;
}
export interface NgbSmartPasteField {
  key: string;
  label: string;
  value?: string;
}
export interface NgbSmartPasteSuggestion {
  field: string;
  value: string;
}
export interface NgbSmartPasteRequest {
  text: string;
  fields: readonly NgbSmartPasteField[];
}
