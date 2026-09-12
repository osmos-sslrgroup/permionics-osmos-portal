// Re-export unified database client from lib/db.ts
export { supabase } from "./db";

export type CaseStudyRow = {
  id: number;
  client_name: string;
  sector: string;
  location: string;
  challenge: string;
  solution: string;
  technology_stack: string;
  capacity: string;
  results: string;
  testimonial: string | null;
  tags: string[];
  full_text: string;
  created_at: string;
  updated_at: string;
};

export type QuestionnaireRow = {
  id: number;
  client_name: string;
  sector: string;
  questions: QuestionItem[];
  answers: Record<string, string>;
  notes: string | null;
  created_at: string;
};

export type QuestionItem = {
  id: string;
  question: string;
  type: string;
  options?: string[];
};
