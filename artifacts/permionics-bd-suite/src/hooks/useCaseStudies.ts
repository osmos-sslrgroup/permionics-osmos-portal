import { CaseStudyData, SavedCaseStudy } from "@/types/case-study";

const STORAGE_KEY = "permionics_case_studies";

function load(): SavedCaseStudy[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(studies: SavedCaseStudy[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(studies));
}

export function useCaseStudies() {
  const studies = load();

  const saveStudy = (data: CaseStudyData, existingId?: string): string => {
    const all = load();
    const id = existingId ?? Math.random().toString(36).substring(2, 11);
    const existing = all.findIndex((s) => s.id === id);
    const study: SavedCaseStudy = { ...data, id, lastModified: Date.now() };

    if (existing >= 0) {
      all[existing] = study;
    } else {
      all.unshift(study);
    }

    save(all);
    return id;
  };

  const deleteStudy = (id: string) => {
    save(load().filter((s) => s.id !== id));
  };

  return { studies, saveStudy, deleteStudy };
}
