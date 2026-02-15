export type ChapterDTO = {
  chapterId: number;
  chapterName: string;
  completed?: boolean; // backend uses isCompleted, we will normalize on client
  revised?: boolean;   // backend uses isRevised, we will normalize on client
  weightage?: number;
  hasHandwrittenNotes?: boolean;
  hasShortNotes?: boolean;
  hasPyqs?: boolean;
  hasVideo?: boolean;
};

export type SheetDTO = {
  id: number;
  subject: string;
  name: string; // title/name
  description?: string;
  totalChapters: number;
  completedChapters: number;
  chapters?: ChapterDTO[];
};

async function http<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    credentials: 'include',
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

// Sheets
export function getSheets() {
  return http<SheetDTO[]>(`/sheets`);
}

export function getSheetById(id: number) {
  return http<SheetDTO>(`/sheets/byId/${id}`);
}
