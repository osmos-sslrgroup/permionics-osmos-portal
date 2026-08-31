import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env["SUPABASE_URL"];
const supabaseServiceKey = process.env["SUPABASE_SERVICE_KEY"];

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL must be set");
}
if (!supabaseServiceKey) {
  throw new Error("SUPABASE_SERVICE_KEY must be set");
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

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
