import { useEffect, useState } from 'react';
import { SubjectSheet } from '@/lib/cet-data';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSheets, getSheetById } from '@/api/sheets';
import { upsertProgress } from '@/api/progress';
import { getResourcesByChapter } from '@/api/resources';
import Carousel from '@/components/Carousel';
import imgAdobe from '@/assets/Adobe Express - file.png';
import imgRemove1 from '@/assets/Remove background project.png';
import imgRemove2 from '@/assets/Remove background project (1).png';
import imgRemove3 from '@/assets/Remove background project (2).png';
import logo from '@/assets/Logo.png';

const Index = () => {
  const queryClient = useQueryClient();
  // Local cache of sheets for UI; populated from backend only
  const [subjectSheets, setSubjectSheets] = useState<SubjectSheet[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [revisionChapters, setRevisionChapters] = useState<Set<string>>(new Set());

  // Single carousel with 4 images
  const mainSlides = [imgAdobe, imgRemove1, imgRemove2, imgRemove3];

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
console.log({subjectSheets})
  useEffect(() => {
    setSubjectSheets(sheetsData ?? []);
  }, [sheetsData]);

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
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-500/3 rounded-full blur-3xl animate-pulse-slow delay-500"></div>
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-pink-500/3 rounded-full blur-3xl animate-float"></div>
      </div>

      <div className="relative z-10 p-6 space-y-8">
      {/* Welcome Header with Animation */}
     
      <div className="text-center mb-6 animate-fade-in">
        <div className="flex items-center justify-center gap-3 mb-2">
        <div className="w-16 h-16 from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-2xl"><img src={logo} alt="EbookStore logo" className="w-20 h-20 object-contain" /></span>
          </div>
          <h1 className="text-5xl font-bold mb-0">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              EbookStore's
            </span>
            <span className="text-white ml-3">Master CET Sheet</span>
          </h1>
        </div>
        <p className="text-base text-zinc-300 max-w-xl mx-auto mt-1">
        Your comprehensive study companion for CET preparation
        </p>
      </div>
      {/* Hero Carousel - no heading, tighter spacing */}
      <div className="animate-fade-in-up -mt-2 mb-6" style={{ animationDelay: '60ms' }}>
        <Carousel
          images={mainSlides}
          autoPlayInterval={3600}
          itemsPerView={3}
          itemsPerViewMobile={2}
          ariaLabel="Highlights Carousel"
        />
      </div>

        {/* Progress Tracker - Mini Layout (with circular indicator) */}
        <div className="glass-morphism rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-center">
            {/* Total Progress */}
            <div className="text-center">
              <h3 className="text-white text-sm mb-1">Total Progress</h3>
              <p className="text-lg font-bold text-white">
                {subjectSheets.reduce((sum, s) => sum + (s.completedChapters || 0), 0)} / {subjectSheets.reduce((sum, s) => sum + (s.totalChapters || 0), 0)}
              </p>
            </div>

            {/* Overall Completion (Circular) */}
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto">
                <svg className="w-16 h-16 transform -rotate-180" viewBox="0 0 36 36">
                  <path
                    d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                    fill="none"
                    stroke="#1f2937"
                    strokeWidth="4.5"
                  />
                  <path
                    d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                    fill="none"
                    stroke="#00bf63"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    strokeDasharray={`${Math.round((subjectSheets.reduce((sum, s) => sum + (s.completedChapters || 0), 0) / subjectSheets.reduce((sum, s) => sum + (s.totalChapters || 0), 0)) * 100)}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white bg-black/70 border border-white/10">
                    {Math.round((subjectSheets.reduce((sum, s) => sum + (s.completedChapters || 0), 0) / subjectSheets.reduce((sum, s) => sum + (s.totalChapters || 0), 0)) * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Physics */}
            <div className="text-center">
              <h3 className="text-white text-sm mb-1">Physics</h3>
              <p className="text-xs text-zinc-300 mb-1">
                {subjectSheets.find(s => s.subject === 'Physics')?.completedChapters || 0} / {subjectSheets.find(s => s.subject === 'Physics')?.totalChapters || 0} completed
              </p>
              <div className="w-full bg-zinc-800/70 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#4285f4]"
                  style={{
                    width: `${Math.round(((subjectSheets.find(s => s.subject === 'Physics')?.completedChapters || 0) / (subjectSheets.find(s => s.subject === 'Physics')?.totalChapters || 1)) * 100)}%`
                  }}
                />
              </div>
            </div>

            {/* Chemistry */}
            <div className="text-center">
              <h3 className="text-white text-sm mb-1">Chemistry</h3>
              <p className="text-xs text-zinc-300 mb-1">
                {subjectSheets.find(s => s.subject === 'Chemistry')?.completedChapters || 0} / {subjectSheets.find(s => s.subject === 'Chemistry')?.totalChapters || 0} completed
              </p>
              <div className="w-full bg-zinc-800/70 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 shadow-[0_0_12px_rgba(245,158,11,0.35)]"
                  style={{
                    width: `${Math.round(((subjectSheets.find(s => s.subject === 'Chemistry')?.completedChapters || 0) / (subjectSheets.find(s => s.subject === 'Chemistry')?.totalChapters || 1)) * 100)}%`
                  }}
                ></div>
              </div>
            </div>

            {/* Maths */}
            <div className="text-center">
              <h3 className="text-white text-sm mb-1">Maths</h3>
              <p className="text-xs text-zinc-300 mb-1">
                {subjectSheets.find(s => s.subject === 'Mathematics')?.completedChapters || 0} / {subjectSheets.find(s => s.subject === 'Mathematics')?.totalChapters || 0} completed
              </p>
              <div className="w-full bg-zinc-800/70 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#ff3b30]"
                  style={{
                    width: `${Math.round(((subjectSheets.find(s => s.subject === 'Mathematics')?.completedChapters || 0) / (subjectSheets.find(s => s.subject === 'Mathematics')?.totalChapters || 1)) * 100)}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>



        {/* Study Sheets with Hover Effects */}
        <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">📚</span>
            <h2 className="text-2xl font-bold text-white">Study Sheets</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {subjectSheets.map((sheet, index) => (
              <div 
                key={sheet.id} 
                className="group cursor-pointer transition-all duration-500 hover:scale-105 animate-fade-in-up card-hover"
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
                <div
                  className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-300 bg-gradient-to-br border 
                    ${sheet.subject === 'Physics' 
                      ? 'from-amber-500/10 to-amber-600/10 border-amber-500/30 hover:border-amber-500/50' 
                      : sheet.subject === 'Chemistry' 
                      ? 'from-emerald-500/10 to-emerald-600/10 border-emerald-500/30 hover:border-emerald-500/50' 
                      : sheet.subject === 'Mathematics' 
                      ? 'from-purple-500/10 to-purple-600/10 border-purple-500/30 hover:border-purple-500/50' 
                      : 'from-zinc-800/50 to-zinc-900/50 border-zinc-700/50 hover:border-zinc-600/50'}
                  `}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-2 transition-colors">
                          {sheet.subject === 'Physics' ? 'Physics' : 
                           sheet.subject === 'Chemistry' ? 'Chemistry' : 
                           sheet.subject === 'Mathematics' ? 'Mathematics' : 
                           sheet.subject === 'Biology' ? 'Biology' : sheet.title}
                        </h3>
                        <p className="text-zinc-300 text-xs mb-3 leading-relaxed">{sheet.description}</p>
                        <div className="flex items-center gap-4 text-xs text-zinc-400">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            {sheet.totalChapters || 0} chapters
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            {sheet.completedChapters || 0} completed
                          </span>
                        </div>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-medium border 
                          ${sheet.subject === 'Physics' 
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                            : sheet.subject === 'Chemistry' 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                            : sheet.subject === 'Mathematics' 
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'}`}
                      >
                        {sheet.subject === 'Physics' ? '50 marks' : 
                         sheet.subject === 'Chemistry' ? '50 marks' : 
                         sheet.subject === 'Mathematics' ? '100 marks' : 
                         sheet.subject === 'Biology' ? '100 marks' : '50 marks'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sleek Matt Black Table Modal */}
      {isModalOpen && selectedSheet && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={handleModalClose}
        >
          <div
            className={`rounded-3xl max-w-7xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-scale-in border 
              ${selectedSheet.subject === 'Physics'
                ? 'border-amber-500/30'
                : selectedSheet.subject === 'Chemistry'
                ? 'border-emerald-500/30'
                : selectedSheet.subject === 'Mathematics'
                ? 'border-purple-500/30'
                : 'border-zinc-600'} bg-gradient-to-br from-zinc-900 to-black`}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className={`p-6 border-b bg-gradient-to-r 
                ${selectedSheet.subject === 'Physics'
                  ? 'from-amber-500/10 to-amber-600/10 border-amber-500/30'
                  : selectedSheet.subject === 'Chemistry'
                  ? 'from-emerald-500/10 to-emerald-600/10 border-emerald-500/30'
                  : selectedSheet.subject === 'Mathematics'
                  ? 'from-purple-500/10 to-purple-600/10 border-purple-500/30'
                  : 'from-zinc-800/50 to-zinc-900/50 border-zinc-600'}`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedSheet.title}</h2>
                  <p className="text-zinc-300 text-sm flex items-center gap-2">
                    {selectedSheet.description}
                    {/* Subtle spinner to indicate background upgrading when chapters are initially missing */}
                    {!selectedSheet?.chapters?.length && (
                      <span className="inline-flex items-center gap-1 text-zinc-400 text-xs">
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
                  className="text-zinc-400 hover:text-white text-2xl p-3 hover:bg-zinc-800/50 rounded-xl transition-all duration-300 hover:scale-110"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Table */}
            <div className="p-6 bg-zinc-900/30">
              <div className="overflow-x-auto max-h-[65vh] overflow-y-auto custom-scrollbar">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-600">
                      <th className="text-left p-4 text-zinc-200 font-semibold text-sm uppercase tracking-wider">Status</th>
                      <th className="text-left p-4 text-zinc-200 font-semibold text-sm uppercase tracking-wider">Chapter</th>
                      <th className="text-center p-4 text-zinc-200 font-semibold text-sm uppercase tracking-wider">Notes</th>
                      <th className="text-center p-4 text-zinc-200 font-semibold text-sm uppercase tracking-wider">Short Notes</th>
                      
                      <th className="text-center p-4 text-zinc-200 font-semibold text-sm uppercase tracking-wider">PYQs</th>
                      
                      <th className="text-center p-4 text-zinc-200 font-semibold text-sm uppercase tracking-wider">Revision</th>
                      <th className="text-center p-4 text-zinc-200 font-semibold text-sm uppercase tracking-wider">Weightage</th>
                      
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-700">
                    {selectedSheet.chapters
                      ?.slice()
                      .sort((a: any, b: any) => Number(a.id) - Number(b.id))
                      .map((chapter: any) => (
                      <tr key={chapter.id} className="hover:bg-zinc-800/30 transition-all duration-300 group">
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={chapter.isCompleted || false}
                            onChange={(e) => handleChapterToggle(selectedSheet.id, chapter.id, e.target.checked)}
                            className="custom-checkbox transition-none duration-75"
                          />
                        </td>
                        <td className="p-4">
                          <span className="text-white font-medium text-base group-hover:text-blue-300 transition-colors">{chapter.name}</span>
                        </td>
                        <td className="p-4 text-center">
                          {chapter.resources?.handwrittenNotes ? (
                            <div
                              onClick={() => handleResourceClick(chapter.id, 'NOTES')}
                              className="inline-flex items-center justify-center w-6 h-6 cursor-pointer hover:scale-110 transition-transform duration-200 hover:bg-blue-500/10 rounded-lg p-1"
                              title="Handwritten Notes"
                            >
                              <span className="text-lg">📝</span>
                            </div>
                          ) : (
                            <span className="text-zinc-500">-</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {chapter.resources?.shortNotes ? (
                            <div
                              onClick={() => handleResourceClick(chapter.id, 'SHORT_NOTES')}
                              className="inline-flex items-center justify-center w-6 h-6 cursor-pointer hover:scale-110 transition-transform duration-200 hover:bg-green-500/10 rounded-lg p-1"
                              title="Short Notes"
                            >
                              <span className="text-lg">📄</span>
                            </div>
                          ) : (
                            <span className="text-zinc-500">-</span>
                          )}
                        </td>
                        
                        <td className="p-4 text-center">
                          {chapter.resources?.pyqs ? (
                            <div
                              onClick={() => handleResourceClick(chapter.id, 'PYQS')}
                              className="inline-flex items-center justify-center w-6 h-6 cursor-pointer hover:scale-110 transition-transform duration-200 hover:bg-orange-500/10 rounded-lg p-1"
                              title="Previous Year Questions"
                            >
                              <span className="text-lg">📋</span>
                            </div>
                          ) : (
                            <span className="text-zinc-500">-</span>
                          )}
                        </td>
                        
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleRevisionToggle(chapter.id)}
                            className={`revision-star inline-flex items-center justify-center w-6 h-6 rounded-lg cursor-pointer transition-all duration-200 hover:scale-110 ${
                              revisionChapters.has(chapter.id) 
                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                                : 'text-zinc-500 hover:text-yellow-400 hover:bg-yellow-500/5'
                            }`}
                            title={revisionChapters.has(chapter.id) ? "Marked for Revision" : "Click to Mark for Revision"}
                          >
                            <span className="text-lg">⭐</span>
                          </button>
                        </td>
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-300 text-sm font-medium">
                            {getChapterWeightage(chapter.name)}%
                          </span>
                        </td>
                        
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index; 