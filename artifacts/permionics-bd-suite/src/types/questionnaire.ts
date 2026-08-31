export type QuestionType = 'Text' | 'Number' | 'Choice' | 'Table';

export interface Question {
  id: string;
  number: number;
  text: string;
  type: QuestionType;
  required: boolean;
  sectionId?: string;
}

export interface Section {
  id: string;
  title: string;
  isExpanded: boolean;
}

export interface ClientInfo {
  companyName: string;
  contactPerson: string;
  date: string;
  location: string;
}

export interface SectorState {
  questions: Question[];
  sections: Section[];
  clientInfo: ClientInfo;
}

export interface AppState {
  [sectorId: string]: SectorState;
}

export interface SavedProject {
  id: number;
  name: string;
  companyName: string;
  contactPerson: string;
  location: string;
  date: string;
  sector: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export const SECTORS = [
  { id: 'pharma', name: 'Pharma & Herbal', description: 'Pharmaceutical & herbal extract process water applications' },
  { id: 'dairy', name: 'Dairy', description: 'Cheese, whey, milk powder and other dairy process applications' },
  { id: 'water', name: 'Water & Wastewater', description: 'Municipal, industrial effluent, and ZLD applications' },
  { id: 'food', name: 'Food & Beverage', description: 'Beverages, edible oils, brewing, and juice applications' },
  { id: 'textile', name: 'Textile', description: 'Dyeing, printing, washing and effluent treatment' },
  { id: 'cetp', name: 'CETP & Municipal', description: 'Common effluent treatment and municipal cluster applications' },
  { id: 'chemical', name: 'Chemical Processing', description: 'Solvent recovery, product concentration, and specialty chemicals' },
];
