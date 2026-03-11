import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { SubjectSheet } from '@/lib/cet-data';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSheets, getSheetById } from '@/api/sheets';
import { upsertProgress } from '@/api/progress';
import { getResourcesByChapter } from '@/api/resources';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import logo from '@/assets/Logo.png';

const Index = () => {
  const queryClient = useQueryClient();
  // authentication info
  const { user } = useAuth();
  const navigate = useNavigate();
  // Local cache of sheets for UI; populated from backend only
  const [subjectSheets, setSubjectSheets] = useState<SubjectSheet[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [revisionChapters, setRevisionChapters] = useState<Set<string>>(new Set());

  const heroSlides = useMemo(
    () => [
      {
        badge: 'Minimal • Fast',
        title: 'Track CET prep like a pro',
        subtitle: 'A clean dashboard for chapters, resources, and revision — all in one place.',
      },
      {
        badge: 'One click',
        title: 'Open notes & PYQs instantly',
        subtitle: 'No hunting links. Everything is mapped to the exact chapter you need.',
      },
      {
        badge: 'High impact',
        title: 'Revise by weightage',
        subtitle: 'Spend time where marks come from with a weightage-aware workflow.',
      },
    ],
    []
  );

  // Map backend DTOs to existing UI shape to minimize UI changes
  const mapDtoToSubjectSheet = (dto: any): SubjectSheet => {
    const chapters = (dto.chapters || []).map((c: any) => ({
      id: String(c.chapterId),
      name: c.chapterName,
      difficulty: 'Medium',
      isImportant: false,
      // Support both possible casings from backend JSON
      isCompleted: Boolean(c.Completed ?? c.completed),
      resources: {
        handwrittenNotes: Boolean(c.hasNotes),
        shortNotes: Boolean(c.hasShortNotes),
        formulaBooklet: false,
        pyqs: Boolean(c.hasPyqs),
        videoExplanation: false,
      },
      status: 'available' as const,
      // carry Revised as a side flag by storing in a weak map if needed; for UI star, we maintain revisionChapters set
    }));
    const completedCount = chapters.filter((ch: any) => ch.isCompleted).length;
    const progress = dto.totalChapters ? Math.round((completedCount / dto.totalChapters) * 100) : 0;
    return {
      id: String(dto.sheetId),
      title: dto.sheetName,
      description: dto.description,
      subject: dto.subject,
      totalChapters: dto.totalChapters,
      completedChapters: dto.completedChapters ?? completedCount,
      availableChapters: dto.totalChapters,
      totalResources: 0,
      progress,
      difficulty: 'Intermediate',
      chapters,
    } as SubjectSheet;
  };

  // Fetch all sheets for landing page
  const { data: sheetsData, isLoading: isSheetsLoading, isError: isSheetsError, error: sheetsError } = useQuery({
    queryKey: ['sheets'],
    queryFn: async () => {
      const res = await getSheets();
      return res.map(mapDtoToSubjectSheet);
    },
  });
  useEffect(() => {
    setSubjectSheets(sheetsData ?? []);
  }, [sheetsData]);

  // when user logs in/out, re-fetch sheets so personalized flags update
  useEffect(() => {
    queryClient.invalidateQueries(['sheets']);
    if (selectedSheet) {
      queryClient.invalidateQueries(['sheet', selectedSheet.id]);
    }
  }, [user, queryClient, selectedSheet]);

  const handleSheetClick = (sheet: any) => {
    // Open modal immediately with current list item to feel instant
    const sheetIdNum = Number(sheet.id ?? sheet.sheetId);
    setSelectedSheet(sheet);
    setIsModalOpen(true);

    // Fetch full/updated sheet in background and upgrade modal when ready
    getSheetById(sheetIdNum)
      .then((dto) => {
        const mapped = mapDtoToSubjectSheet(dto);
        setSelectedSheet(mapped);
        // Initialize revision set from backend Revised flag (support both casings)
        const revisedSet = new Set<string>();
        dto.chapters?.forEach((c: any) => {
          const isRev = Boolean(c.Revised ?? c.revised);
          if (isRev) revisedSet.add(String(c.chapterId));
        });
        setRevisionChapters(revisedSet);
      })
      .catch(() => {
        // Keep the initially selected sheet; optionally show a toast later
      });
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedSheet(null);
  };

  // Mutation for toggling chapter completion with optimistic UI
  const toggleMutation = useMutation({
    mutationFn: ({ chapterId, completed }: { chapterId: number; completed: boolean }) =>
      upsertProgress({ chapterId, completed }),
    onSuccess: () => {
      // refetch list so updated flag is included
      queryClient.invalidateQueries(['sheets']);
      if (selectedSheet) {
        queryClient.invalidateQueries(['sheet', selectedSheet.id]);
      }
    },
  });

  const handleChapterToggle = (subjectId: string, chapterId: string, isCompleted: boolean) => {
    if (!user) {
      navigate('/login');
      return;
    }
    // Optimistic update UI (same as before)
    setSubjectSheets(prev => prev.map(subject => {
      if (subject.id === subjectId) {
        const updatedChapters = subject.chapters.map(ch => ch.id === chapterId ? { ...ch, isCompleted } : ch);
        const completedCount = updatedChapters.filter(ch => ch.isCompleted).length;
        const progress = Math.round((completedCount / subject.totalChapters) * 100);
        const updatedSubject = { ...subject, chapters: updatedChapters, completedChapters: completedCount, progress };
        if (selectedSheet && selectedSheet.id === subjectId) setSelectedSheet(updatedSubject);
        return updatedSubject;
      }
      return subject;
    }));

    toggleMutation.mutate(
      { chapterId: Number(chapterId), completed: isCompleted },
      {
        onError: () => {
          // Rollback if failed: flip back
          setSubjectSheets(prev => prev.map(subject => {
            if (subject.id === subjectId) {
              const updatedChapters = subject.chapters.map(ch => ch.id === chapterId ? { ...ch, isCompleted: !isCompleted } : ch);
              const completedCount = updatedChapters.filter(ch => ch.isCompleted).length;
              const progress = Math.round((completedCount / subject.totalChapters) * 100);
              const updatedSubject = { ...subject, chapters: updatedChapters, completedChapters: completedCount, progress };
              if (selectedSheet && selectedSheet.id === subjectId) setSelectedSheet(updatedSubject);
              return updatedSubject;
            }
            return subject;
          }));
        },
      }
    );
  };

  const handleResourceClick = async (chapterId: string, type: 'NOTES' | 'SHORT_NOTES' | 'PYQS') => {
    try {
      const resources = await getResourcesByChapter(Number(chapterId), type);
      if (resources && resources.length) {
        const r = resources[0];
        // Prefer backend-computed previewUrl when available
        if (r.previewUrl) {
          window.open(r.previewUrl, '_blank');
          return;
        }
        // Fallback to Drive file id
        if (r.driveFileId) {
          window.open(`/viewer/${r.driveFileId}`, '_blank');
          return;
        }
        // Last resort: if resourceName looks like a URL, open it
        if (r.resourceName && /^https?:\/\//i.test(r.resourceName)) {
          window.open(r.resourceName, '_blank');
        }
      }
    } catch {
      // Silently fail for now; could add toast
    }
  };

  const handleRevisionToggle = (chapterId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    const willBeRevised = !revisionChapters.has(chapterId);
    // Optimistic update
    setRevisionChapters(prev => {
      const newSet = new Set(prev);
      if (willBeRevised) newSet.add(chapterId); else newSet.delete(chapterId);
      return newSet;
    });
    // Persist to backend via progress API so completed flag is preserved as well
    upsertProgress({ chapterId: Number(chapterId), revised: willBeRevised })
      .catch(() => {
        // Rollback on error
        setRevisionChapters(prev => {
          const newSet = new Set(prev);
          if (willBeRevised) newSet.delete(chapterId); else newSet.add(chapterId);
          return newSet;
        });
      });
  };

  // Calculate total resources safely
  const totalResources = subjectSheets.reduce((sum, sheet) => {
    return sum + (sheet.chapters?.length || 0) * 5; // 5 resources per chapter
  }, 0);

  // Helper function to get chapter weightage
  const getChapterWeightage = (chapterName: string): number => {
    const weightageMap: { [key: string]: number } = {
      'Units and Measurements': 3,
      'Motion in a Straight Line': 5,
      'Motion in a Plane': 6,
      'Laws of Motion': 8,
      'Work, Power, Energy': 7,
      'Circular Motion': 6,
      'Gravitation': 5,
      'Mechanical Properties of Solids': 4,
      'Mechanical Properties of Fluids': 4,
      'Thermal Properties of Matter': 5,
      'Thermodynamics': 6,
      'Kinetic Theory': 4,
      'Oscillations': 5,
      'Waves': 6,
      'Electric Charges and Fields': 7,
      'Electrostatic Potential': 6,
      'Current Electricity': 8,
      'Moving Charges and Magnetism': 7,
      'Magnetism and Matter': 5,
      'Electromagnetic Induction': 6,
      'Alternating Current': 5,
      'Electromagnetic Waves': 4,
      'Ray Optics': 6,
      'Wave Optics': 5,
      'Dual Nature of Matter': 4,
      'Atoms': 3,
      'Nuclei': 4,
      'Semiconductor Electronics': 5,
      'Communication Systems': 3
    };
    
    return weightageMap[chapterName] || 4; // Default weightage is 4%
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative">
        {/* Minimal background accent */}
        <div className="pointer-events-none absolute inset-x-0 -top-24 h-48 blur-3xl opacity-60">
          <div className="mx-auto h-full w-[720px] max-w-full ig-gradient rounded-[999px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10 space-y-7">
          {/* Hero */}
          <section className="grid gap-6 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] items-stretch">
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-card border border-border shadow-soft dark:shadow-soft-dark flex items-center justify-center">
                  <img src={logo} alt="EbookStore logo" className="h-10 w-10 object-contain" />
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground shadow-soft dark:shadow-soft-dark">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Flat • Minimal • Premium
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight">
                  <span className="gradient-text">Master CET Sheet</span>
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground max-w-xl">
                  Track chapters, open notes, and plan revisions with a clean, trendy dashboard.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => navigate(user ? "/" : "/login")}
                  className="rounded-full px-5 py-2.5 text-sm font-semibold text-white ig-gradient shadow-soft dark:shadow-soft-dark hover:opacity-95 transition-opacity"
                >
                  {user ? "Open dashboard" : "Start for free"}
                </button>
                <button
                  onClick={() => window.scrollTo({ top: 560, behavior: "smooth" })}
                  className="rounded-full px-5 py-2.5 text-sm font-semibold bg-card border border-border shadow-soft dark:shadow-soft-dark hover:bg-accent transition-colors"
                >
                  Browse sheets
                </button>
              </div>

              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="rounded-full bg-card border border-border px-3 py-1 shadow-soft dark:shadow-soft-dark">
                  {subjectSheets.length} subjects
                </span>
                <span className="rounded-full bg-card border border-border px-3 py-1 shadow-soft dark:shadow-soft-dark">
                  {subjectSheets.reduce((sum, s) => sum + (s.totalChapters || 0), 0)} chapters
                </span>
              </div>
            </div>

            {/* Highlights carousel */}
            <div className="ig-border shadow-soft dark:shadow-soft-dark">
              <div className="ig-border-inner ig-border-inner p-4 sm:p-5">
                <Carousel opts={{ align: 'start', loop: true }}>
                  <CarouselContent>
                    {heroSlides.map((slide, idx) => (
                      <CarouselItem key={idx} className="basis-full">
                        <div className="surface shadow-soft dark:shadow-soft-dark p-5 sm:p-6">
                          <div className="flex items-center justify-between gap-3 mb-3">
                            <span className="text-xs font-semibold text-muted-foreground">
                              {slide.badge}
                            </span>
                            <span className="h-2 w-2 rounded-full bg-foreground/10" />
                          </div>
                          <h3 className="text-lg font-semibold tracking-tight">{slide.title}</h3>
                          <p className="mt-2 text-sm text-muted-foreground">{slide.subtitle}</p>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="hidden sm:flex" />
                  <CarouselNext className="hidden sm:flex" />
                </Carousel>
              </div>
            </div>
          </section>

          {/* Stats row */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="surface shadow-soft dark:shadow-soft-dark p-5">
              <p className="text-xs text-muted-foreground">Overall progress</p>
              <p className="mt-1 text-2xl font-semibold">
                {Math.round(
                  (subjectSheets.reduce((sum, s) => sum + (s.completedChapters || 0), 0) /
                    Math.max(subjectSheets.reduce((sum, s) => sum + (s.totalChapters || 0), 0), 1)) *
                    100
                )}
                %
              </p>
              <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full ig-gradient"
                  style={{
                    width: `${Math.round(
                      (subjectSheets.reduce((sum, s) => sum + (s.completedChapters || 0), 0) /
                        Math.max(subjectSheets.reduce((sum, s) => sum + (s.totalChapters || 0), 0), 1)) *
                        100
                    )}%`,
                  }}
                />
              </div>
            </div>
            {[
              { key: 'Physics', dot: 'bg-sky-500' },
              { key: 'Chemistry', dot: 'bg-emerald-500' },
              { key: 'Mathematics', dot: 'bg-violet-500' },
            ].map(({ key, dot }) => {
              const s = subjectSheets.find((x) => x.subject === key);
              const completed = s?.completedChapters || 0;
              const total = s?.totalChapters || 0;
              return (
                <div key={key} className="surface shadow-soft dark:shadow-soft-dark p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{key}</p>
                    <span className={`h-2 w-2 rounded-full ${dot}`} />
                  </div>
                  <p className="mt-1 text-2xl font-semibold">{completed}</p>
                  <p className="text-xs text-muted-foreground">{total} chapters</p>
                </div>
              );
            })}
          </section>

          {/* Study Sheets */}
          <section className="pt-2">
            <div className="flex items-end justify-between gap-4 mb-4 sm:mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Study sheets</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Tap a subject to open chapters, notes and PYQs.
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-card border border-border px-3 py-1 shadow-soft dark:shadow-soft-dark">
                  Minimal
                </span>
                <span className="rounded-full bg-card border border-border px-3 py-1 shadow-soft dark:shadow-soft-dark">
                  Flat
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {subjectSheets.map((sheet, index) => (
                <div 
                  key={sheet.id} 
                  className="group cursor-pointer animate-fade-in-up card-hover"
                  style={{ animationDelay: `${500 + index * 100}ms` }}
                  onClick={() => handleSheetClick(sheet)}
                  onMouseEnter={() => {
                    // Prefetch detailed sheet to reduce waiting on click
                    const sheetIdNum = Number((sheet as any).id ?? (sheet as any).sheetId);
                    if (!Number.isNaN(sheetIdNum)) {
                      queryClient.prefetchQuery({
                        queryKey: ['sheet', sheetIdNum],
                        queryFn: () => getSheetById(sheetIdNum),
                        staleTime: 5 * 60 * 1000,
                      });
                    }
                  }}
                >
                  <div className="surface shadow-soft dark:shadow-soft-dark p-6">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex-1">
                        <h3 className="text-base sm:text-lg font-semibold tracking-tight mb-2">
                            {sheet.subject === 'Physics' ? 'Physics' : 
                             sheet.subject === 'Chemistry' ? 'Chemistry' : 
                             sheet.subject === 'Mathematics' ? 'Mathematics' : 
                             sheet.subject === 'Biology' ? 'Biology' : sheet.title}
                      </h3>
                      </div>
                      <div className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground shadow-soft dark:shadow-soft-dark">
                        {sheet.subject === 'Physics' ? '50 marks' : 
                         sheet.subject === 'Chemistry' ? '50 marks' : 
                         sheet.subject === 'Mathematics' ? '100 marks' : 
                         sheet.subject === 'Biology' ? '100 marks' : '50 marks'}
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      {sheet.description}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">
                        {sheet.totalChapters || 0} chapters
                      </span>
                      <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">
                        {sheet.completedChapters || 0} completed
                      </span>
                      <span className="ml-auto hidden sm:inline-flex items-center gap-2 text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-foreground/15" />
                        <span className="gradient-text font-semibold">Open</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
      {/* Sleek Matt Black Table Modal */}
      {isModalOpen && selectedSheet && (
        <div
          className="fixed inset-0 bg-background/70 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-fade-in"
          onClick={handleModalClose}
        >
          <div
            className="surface shadow-soft dark:shadow-soft-dark max-w-7xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-3 sm:p-6 border-b border-border">
              <div className="flex justify-between items-start gap-2 sm:items-center">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-2xl font-semibold text-foreground mb-1 sm:mb-2 truncate">{selectedSheet.title}</h2>
                  <p className="text-muted-foreground text-xs sm:text-sm flex items-center gap-2 truncate">
                    {selectedSheet.description}
                    {/* Subtle spinner to indicate background upgrading when chapters are initially missing */}
                    {!selectedSheet?.chapters?.length && (
                      <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                        </svg>
                        loading…
                      </span>
                    )}
                  </p>
                </div>
                <button 
                  onClick={handleModalClose}
                  className="text-muted-foreground hover:text-foreground text-xl sm:text-2xl p-2 sm:p-3 hover:bg-accent rounded-2xl transition-all duration-300 hover:scale-110 flex-shrink-0"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Table */}
            <div className="p-3 sm:p-6 bg-background">
              <div className="max-h-[60vh] sm:max-h-[65vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-2">
                  <div className="hidden sm:grid sm:grid-cols-[80px_2fr_120px_120px_120px_120px_100px] gap-4 border-b border-border pb-3 px-4 sticky top-0 bg-background z-10">
                    <div className="text-center text-muted-foreground font-semibold text-xs uppercase tracking-wider">Done</div>
                    <div className="text-left text-muted-foreground font-semibold text-xs uppercase tracking-wider">Chapter</div>
                    <div className="text-center text-muted-foreground font-semibold text-xs uppercase tracking-wider">Notes</div>
                    <div className="text-center text-muted-foreground font-semibold text-xs uppercase tracking-wider">Short</div>
                    <div className="text-center text-muted-foreground font-semibold text-xs uppercase tracking-wider">PYQs</div>
                    <div className="text-center text-muted-foreground font-semibold text-xs uppercase tracking-wider">Revise</div>
                    <div className="text-center text-muted-foreground font-semibold text-xs uppercase tracking-wider">Weight</div>
                  </div>
                  {selectedSheet.chapters
                      ?.slice()
                      .sort((a: any, b: any) => Number(a.id) - Number(b.id))
                      .map((chapter: any) => (
                      <div key={chapter.id} className="bg-card rounded-2xl p-3 sm:p-0 sm:grid sm:grid-cols-[80px_2fr_120px_120px_120px_120px_100px] sm:gap-4 sm:items-center sm:px-4 sm:py-3 border border-border sm:border-0 sm:border-b sm:rounded-none hover:bg-accent transition-colors duration-200">
                        {/* Mobile Card View */}
                        <div className="sm:hidden space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4 className="text-foreground font-medium text-sm">{chapter.name}</h4>
                            </div>
                            <input
                              type="checkbox"
                              checked={chapter.isCompleted || false}
                              onChange={(e) => handleChapterToggle(selectedSheet.id, chapter.id, e.target.checked)}
                              className="custom-checkbox transition-none duration-75 cursor-pointer flex-shrink-0"
                            />
                          </div>
                          
                          <div className="flex items-center gap-3 flex-wrap text-xs">
                            {chapter.resources?.handwrittenNotes && (
                              <div
                                onClick={() => handleResourceClick(chapter.id, 'NOTES')}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/10 rounded cursor-pointer hover:bg-blue-500/20 transition"
                                title="Handwritten Notes"
                              >
                                <span>📝</span>
                                <span className="text-zinc-400">Notes</span>
                              </div>
                            )}
                            {chapter.resources?.shortNotes && (
                              <div
                                onClick={() => handleResourceClick(chapter.id, 'SHORT_NOTES')}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/10 rounded cursor-pointer hover:bg-green-500/20 transition"
                                title="Short Notes"
                              >
                                <span>📄</span>
                                <span className="text-zinc-400">Short</span>
                              </div>
                            )}
                            {chapter.resources?.pyqs && (
                              <div
                                onClick={() => handleResourceClick(chapter.id, 'PYQS')}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500/10 rounded cursor-pointer hover:bg-orange-500/20 transition"
                                title="Previous Year Questions"
                              >
                                <span>📋</span>
                                <span className="text-zinc-400">PYQs</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs">
                            <button
                              onClick={() => handleRevisionToggle(chapter.id)}
                              className={`px-2 py-1 rounded cursor-pointer transition-all ${
                                revisionChapters.has(chapter.id) 
                                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                                  : 'text-zinc-500 hover:text-yellow-400 hover:bg-yellow-500/5'
                              }`}
                              title={revisionChapters.has(chapter.id) ? "Marked for Revision" : "Click to Mark for Revision"}
                            >
                              <span>⭐</span> {revisionChapters.has(chapter.id) ? 'Revision' : 'Mark'}
                            </button>
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-300 font-medium">
                              {getChapterWeightage(chapter.name)}%
                            </span>
                          </div>
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden sm:block sm:px-2">
                          <input
                            type="checkbox"
                            checked={chapter.isCompleted || false}
                            onChange={(e) => handleChapterToggle(selectedSheet.id, chapter.id, e.target.checked)}
                            className="custom-checkbox transition-none duration-75 cursor-pointer"
                          />
                        </div>
                        <div className="hidden sm:block sm:px-2">
                          <span className="text-foreground font-medium text-sm">{chapter.name}</span>
                        </div>
                        <div className="hidden sm:flex sm:justify-center">
                          {chapter.resources?.handwrittenNotes ? (
                            <div
                              onClick={() => handleResourceClick(chapter.id, 'NOTES')}
                              className="inline-flex items-center justify-center w-8 h-8 cursor-pointer hover:scale-110 transition-transform duration-200 hover:bg-blue-500/10 rounded-lg"
                              title="Handwritten Notes"
                            >
                              <span className="text-lg">📝</span>
                            </div>
                          ) : (
                            <span className="text-zinc-500 text-sm font-medium">-</span>
                          )}
                        </div>
                        <div className="hidden sm:flex sm:justify-center">
                          {chapter.resources?.shortNotes ? (
                            <div
                              onClick={() => handleResourceClick(chapter.id, 'SHORT_NOTES')}
                              className="inline-flex items-center justify-center w-8 h-8 cursor-pointer hover:scale-110 transition-transform duration-200 hover:bg-green-500/10 rounded-lg"
                              title="Short Notes"
                            >
                              <span className="text-lg">📄</span>
                            </div>
                          ) : (
                            <span className="text-zinc-500 text-sm font-medium">-</span>
                          )}
                        </div>
                        <div className="hidden sm:flex sm:justify-center">
                          {chapter.resources?.pyqs ? (
                            <div
                              onClick={() => handleResourceClick(chapter.id, 'PYQS')}
                              className="inline-flex items-center justify-center w-8 h-8 cursor-pointer hover:scale-110 transition-transform duration-200 hover:bg-orange-500/10 rounded-lg"
                              title="Previous Year Questions"
                            >
                              <span className="text-lg">📋</span>
                            </div>
                          ) : (
                            <span className="text-zinc-500 text-sm font-medium">-</span>
                          )}
                        </div>
                        <div className="hidden sm:flex sm:justify-center">
                          <button
                            onClick={() => handleRevisionToggle(chapter.id)}
                            className={`revision-star inline-flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-all duration-200 hover:scale-110 ${
                              revisionChapters.has(chapter.id) 
                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                                : 'text-zinc-500 hover:text-yellow-400 hover:bg-yellow-500/5'
                            }`}
                            title={revisionChapters.has(chapter.id) ? "Marked for Revision" : "Click to Mark for Revision"}
                          >
                            <span className="text-lg">⭐</span>
                          </button>
                        </div>
                        <div className="hidden sm:flex sm:justify-center">
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium">
                            {getChapterWeightage(chapter.name)}%
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
</div>
  );
};

export default Index;