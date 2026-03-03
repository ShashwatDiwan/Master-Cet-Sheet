import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { SubjectSheet } from '@/lib/cet-data';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSheets, getSheetById } from '@/api/sheets';
import { upsertProgress } from '@/api/progress';
import { getResourcesByChapter } from '@/api/resources';
import logo from '@/assets/Logo.png';
import { Button } from '@/components/ui/button';
import { 
  GraduationCap, 
  BookOpen, 
  CheckCircle2, 
  Trophy, 
  FileText, 
  ScrollText, 
  HelpCircle, 
  Star, 
  X,
  Loader2
} from 'lucide-react';

const Index = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subjectSheets, setSubjectSheets] = useState<SubjectSheet[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [revisionChapters, setRevisionChapters] = useState<Set<string>>(new Set());

  // Map backend DTOs to existing UI shape
  const mapDtoToSubjectSheet = (dto: any): SubjectSheet => {
    const chapters = (dto.chapters || []).map((c: any) => ({
      id: String(c.chapterId),
      name: c.chapterName,
      difficulty: 'Medium',
      isImportant: false,
      isCompleted: Boolean(c.Completed ?? c.completed),
      resources: {
        handwrittenNotes: Boolean(c.hasNotes),
        shortNotes: Boolean(c.hasShortNotes),
        formulaBooklet: false,
        pyqs: Boolean(c.hasPyqs),
        videoExplanation: false,
      },
      status: 'available' as const,
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

  const { data: sheetsData } = useQuery({
    queryKey: ['sheets'],
    queryFn: async () => {
      const res = await getSheets();
      return res.map(mapDtoToSubjectSheet);
    },
  });

  useEffect(() => {
    setSubjectSheets(sheetsData ?? []);
  }, [sheetsData]);

  useEffect(() => {
    queryClient.invalidateQueries(['sheets']);
    if (selectedSheet) {
      queryClient.invalidateQueries(['sheet', selectedSheet.id]);
    }
  }, [user, queryClient, selectedSheet]);

  const handleSheetClick = (sheet: any) => {
    const sheetIdNum = Number(sheet.id ?? sheet.sheetId);
    setSelectedSheet(sheet);
    setIsModalOpen(true);

    getSheetById(sheetIdNum)
      .then((dto) => {
        const mapped = mapDtoToSubjectSheet(dto);
        setSelectedSheet(mapped);
        const revisedSet = new Set<string>();
        dto.chapters?.forEach((c: any) => {
          const isRev = Boolean(c.Revised ?? c.revised);
          if (isRev) revisedSet.add(String(c.chapterId));
        });
        setRevisionChapters(revisedSet);
      })
      .catch(() => {});
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedSheet(null);
  };

  const toggleMutation = useMutation({
    mutationFn: ({ chapterId, completed }: { chapterId: number; completed: boolean }) =>
      upsertProgress({ chapterId, completed }),
    onSuccess: () => {
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
        if (r.previewUrl) {
          window.open(r.previewUrl, '_blank');
          return;
        }
        if (r.driveFileId) {
          window.open(`/viewer/${r.driveFileId}`, '_blank');
          return;
        }
        if (r.resourceName && /^https?:\/\//i.test(r.resourceName)) {
          window.open(r.resourceName, '_blank');
        }
      }
    } catch {
      // Silently fail
    }
  };

  const handleRevisionToggle = (chapterId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    const willBeRevised = !revisionChapters.has(chapterId);
    setRevisionChapters(prev => {
      const newSet = new Set(prev);
      if (willBeRevised) newSet.add(chapterId); else newSet.delete(chapterId);
      return newSet;
    });
    upsertProgress({ chapterId: Number(chapterId), revised: willBeRevised })
      .catch(() => {
        setRevisionChapters(prev => {
          const newSet = new Set(prev);
          if (willBeRevised) newSet.delete(chapterId); else newSet.add(chapterId);
          return newSet;
        });
      });
  };

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
    return weightageMap[chapterName] || 4;
  };

  // Computed values
  const totalChapters = subjectSheets.reduce((sum, s) => sum + (s.totalChapters || 0), 0);
  const totalCompleted = subjectSheets.reduce((sum, s) => sum + (s.completedChapters || 0), 0);
  const overallPercent = totalChapters ? Math.round((totalCompleted / totalChapters) * 100) : 0;

  const getSubjectColor = (subject: string) => {
    if (subject === 'Physics') return { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30', bar: 'bg-blue-500', badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20' };
    if (subject === 'Chemistry') return { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', bar: 'bg-emerald-500', badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20' };
    if (subject === 'Mathematics') return { bg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-500/30', bar: 'bg-violet-500', badge: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20' };
    return { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30', bar: 'bg-primary', badge: 'bg-primary/10 text-primary border-primary/20' };
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">

        {/* Hero Section */}
        <div className="relative rounded-xl bg-gradient-to-b from-primary/5 to-transparent border border-border p-6 sm:p-10 text-center animate-fade-in-up overflow-hidden">
          <div className="relative z-10">
            <img src={logo} alt="EbookStore logo" className="w-20 h-20 object-contain mx-auto mb-4" />
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground font-poppins mb-2 text-balance">
              {"EbookStore's "}
              <span className="text-primary">Master CET Sheet</span>
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto mb-6 text-sm sm:text-base">
              Your comprehensive study companion for CET preparation
            </p>

            {/* Quick Stats */}
            <div className="flex items-center justify-center gap-6 sm:gap-10 mb-6">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-foreground">{totalChapters}</p>
                <p className="text-xs text-muted-foreground">Total Chapters</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">{totalCompleted}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-primary">{overallPercent}%</p>
                <p className="text-xs text-muted-foreground">Overall</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              {!user && (
                <Button onClick={() => navigate('/login')}>
                  Get Started
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate('/contributors')}>
                <Trophy className="w-4 h-4 mr-1.5" />
                View Contributors
              </Button>
            </div>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Progress Tracker</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Overall Circular */}
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 flex-shrink-0">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                  <circle 
                    cx="18" cy="18" r="15.9" fill="none" 
                    stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round"
                    strokeDasharray={`${overallPercent}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-foreground">{overallPercent}%</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Overall</p>
                <p className="text-xs text-muted-foreground">{totalCompleted}/{totalChapters}</p>
              </div>
            </div>

            {/* Subject Progress Bars */}
            {['Physics', 'Chemistry', 'Mathematics'].map((subject) => {
              const sheet = subjectSheets.find(s => s.subject === subject);
              const completed = sheet?.completedChapters || 0;
              const total = sheet?.totalChapters || 1;
              const percent = Math.round((completed / total) * 100);
              const colors = getSubjectColor(subject);
              return (
                <div key={subject}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-foreground">{subject}</span>
                    <span className="text-xs text-muted-foreground">{completed}/{total}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${colors.bar} transition-all duration-500`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{percent}% complete</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Study Sheets */}
        <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground font-poppins">Study Sheets</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectSheets.map((sheet, index) => {
              const colors = getSubjectColor(sheet.subject);
              return (
                <div 
                  key={sheet.id} 
                  className={`group cursor-pointer bg-card border rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md animate-fade-in-up ${colors.border} hover:border-primary/40`}
                  style={{ animationDelay: `${300 + index * 80}ms` }}
                  onClick={() => handleSheetClick(sheet)}
                  onMouseEnter={() => {
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
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-foreground mb-1">
                        {sheet.subject === 'Physics' ? 'Physics' : 
                         sheet.subject === 'Chemistry' ? 'Chemistry' : 
                         sheet.subject === 'Mathematics' ? 'Mathematics' : 
                         sheet.subject === 'Biology' ? 'Biology' : sheet.title}
                      </h3>
                      <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">{sheet.description}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ml-3 flex-shrink-0 ${colors.badge}`}>
                      {sheet.subject === 'Mathematics' || sheet.subject === 'Biology' ? '100 marks' : '50 marks'}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${colors.bar} transition-all duration-500`}
                        style={{ width: `${sheet.progress || 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      {sheet.totalChapters || 0} chapters
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {sheet.completedChapters || 0} done
                    </span>
                    <span className="font-medium text-foreground">{sheet.progress || 0}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chapter Modal */}
      {isModalOpen && selectedSheet && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-fade-in"
          onClick={handleModalClose}
        >
          <div
            className="bg-card border border-border rounded-xl max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-lg animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-border bg-muted/30">
              <div className="flex justify-between items-start gap-2 sm:items-center">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-foreground mb-1 truncate font-poppins">{selectedSheet.title}</h2>
                  <p className="text-muted-foreground text-xs sm:text-sm flex items-center gap-2 truncate">
                    {selectedSheet.description}
                    {!selectedSheet?.chapters?.length && (
                      <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        loading...
                      </span>
                    )}
                  </p>
                </div>
                <button 
                  onClick={handleModalClose}
                  className="text-muted-foreground hover:text-foreground p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Table */}
            <div className="p-3 sm:p-6">
              <div className="max-h-[60vh] sm:max-h-[65vh] overflow-y-auto">
                <div className="space-y-1">
                  {/* Desktop Header */}
                  <div className="hidden sm:grid sm:grid-cols-[60px_2fr_100px_100px_100px_100px_80px] gap-3 border-b border-border pb-3 px-3 sticky top-0 bg-card z-10">
                    <div className="text-center text-muted-foreground font-medium text-xs uppercase tracking-wider">Done</div>
                    <div className="text-left text-muted-foreground font-medium text-xs uppercase tracking-wider">Chapter</div>
                    <div className="text-center text-muted-foreground font-medium text-xs uppercase tracking-wider">Notes</div>
                    <div className="text-center text-muted-foreground font-medium text-xs uppercase tracking-wider">Short</div>
                    <div className="text-center text-muted-foreground font-medium text-xs uppercase tracking-wider">PYQs</div>
                    <div className="text-center text-muted-foreground font-medium text-xs uppercase tracking-wider">Revise</div>
                    <div className="text-center text-muted-foreground font-medium text-xs uppercase tracking-wider">Weight</div>
                  </div>

                  {selectedSheet.chapters
                    ?.slice()
                    .sort((a: any, b: any) => Number(a.id) - Number(b.id))
                    .map((chapter: any) => (
                      <div key={chapter.id} className="rounded-lg p-3 sm:p-0 sm:grid sm:grid-cols-[60px_2fr_100px_100px_100px_100px_80px] sm:gap-3 sm:items-center sm:px-3 sm:py-2.5 border border-border sm:border-0 sm:border-b hover:bg-muted/30 transition-colors">
                        {/* Mobile Card View */}
                        <div className="sm:hidden space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-foreground font-medium text-sm flex-1">{chapter.name}</h4>
                            <input
                              type="checkbox"
                              checked={chapter.isCompleted || false}
                              onChange={(e) => handleChapterToggle(selectedSheet.id, chapter.id, e.target.checked)}
                              className="custom-checkbox flex-shrink-0"
                            />
                          </div>
                          
                          <div className="flex items-center gap-2 flex-wrap">
                            {chapter.resources?.handwrittenNotes && (
                              <button
                                onClick={() => handleResourceClick(chapter.id, 'NOTES')}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded text-xs hover:bg-primary/20 transition"
                              >
                                <FileText className="w-3 h-3" />
                                Notes
                              </button>
                            )}
                            {chapter.resources?.shortNotes && (
                              <button
                                onClick={() => handleResourceClick(chapter.id, 'SHORT_NOTES')}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded text-xs hover:bg-emerald-500/20 transition"
                              >
                                <ScrollText className="w-3 h-3" />
                                Short
                              </button>
                            )}
                            {chapter.resources?.pyqs && (
                              <button
                                onClick={() => handleResourceClick(chapter.id, 'PYQS')}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded text-xs hover:bg-amber-500/20 transition"
                              >
                                <HelpCircle className="w-3 h-3" />
                                PYQs
                              </button>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs">
                            <button
                              onClick={() => handleRevisionToggle(chapter.id)}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                                revisionChapters.has(chapter.id) 
                                  ? 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30' 
                                  : 'text-muted-foreground hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-500/10'
                              }`}
                            >
                              <Star className={`w-3 h-3 ${revisionChapters.has(chapter.id) ? 'fill-current' : ''}`} />
                              {revisionChapters.has(chapter.id) ? 'Revision' : 'Mark'}
                            </button>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium text-xs">
                              {getChapterWeightage(chapter.name)}%
                            </span>
                          </div>
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden sm:flex sm:justify-center">
                          <input
                            type="checkbox"
                            checked={chapter.isCompleted || false}
                            onChange={(e) => handleChapterToggle(selectedSheet.id, chapter.id, e.target.checked)}
                            className="custom-checkbox"
                          />
                        </div>
                        <div className="hidden sm:block">
                          <span className={`text-sm font-medium ${chapter.isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{chapter.name}</span>
                        </div>
                        <div className="hidden sm:flex sm:justify-center">
                          {chapter.resources?.handwrittenNotes ? (
                            <button
                              onClick={() => handleResourceClick(chapter.id, 'NOTES')}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                              title="Handwritten Notes"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-muted-foreground/40 text-sm">-</span>
                          )}
                        </div>
                        <div className="hidden sm:flex sm:justify-center">
                          {chapter.resources?.shortNotes ? (
                            <button
                              onClick={() => handleResourceClick(chapter.id, 'SHORT_NOTES')}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                              title="Short Notes"
                            >
                              <ScrollText className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-muted-foreground/40 text-sm">-</span>
                          )}
                        </div>
                        <div className="hidden sm:flex sm:justify-center">
                          {chapter.resources?.pyqs ? (
                            <button
                              onClick={() => handleResourceClick(chapter.id, 'PYQS')}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors"
                              title="Previous Year Questions"
                            >
                              <HelpCircle className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-muted-foreground/40 text-sm">-</span>
                          )}
                        </div>
                        <div className="hidden sm:flex sm:justify-center">
                          <button
                            onClick={() => handleRevisionToggle(chapter.id)}
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                              revisionChapters.has(chapter.id) 
                                ? 'text-yellow-500 bg-yellow-500/10' 
                                : 'text-muted-foreground/40 hover:text-yellow-500 hover:bg-yellow-500/10'
                            }`}
                            title={revisionChapters.has(chapter.id) ? "Marked for Revision" : "Click to Mark for Revision"}
                          >
                            <Star className={`w-4 h-4 ${revisionChapters.has(chapter.id) ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                        <div className="hidden sm:flex sm:justify-center">
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
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
  );
};

export default Index;
