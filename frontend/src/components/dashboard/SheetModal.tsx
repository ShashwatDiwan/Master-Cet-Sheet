import { X, CheckCircle, Clock, FileText, Scroll, Calculator, HelpCircle, Play, RotateCcw, Star, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Chapter, SubjectSheet } from '@/lib/cet-data';

interface SheetModalProps {
  sheet: SubjectSheet | null;
  isOpen: boolean;
  onClose: () => void;
  onChapterView: (chapterId: string) => void;
  onChapterDownload: (chapterId: string) => void;
  onChapterToggle: (subjectId: string, chapterId: string, isCompleted: boolean) => void;
}

interface SheetData {
  id: string;
  title: string;
  subject: string;
  totalChapters: number;
  availableChapters: number;
  totalResources: number;
  progress: number;
  chapters: Chapter[];
}

interface SheetModalProps {
  sheet: SheetData | null;
  isOpen: boolean;
  onClose: () => void;
  onChapterView: (chapterId: string) => void;
  onChapterDownload: (chapterId: string) => void;
}

export const SheetModal = ({ sheet, isOpen, onClose, onChapterView, onChapterDownload }: SheetModalProps) => {
  if (!isOpen || !sheet) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'coming-soon':
        return <Clock className="w-4 h-4 text-warning" />;
      default:
        return <HelpCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-success/10 text-success border-success/20';
      case 'Medium':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'Hard':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };



  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-card rounded-lg shadow-elegant w-full max-w-6xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold text-foreground font-poppins">{sheet.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {sheet.availableChapters} of {sheet.totalChapters} chapters available
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Chapter Table */}
        <div className="p-6 overflow-x-auto max-h-[calc(90vh-120px)]">
          <div className="bg-muted/20 rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="grid gap-4 p-4 bg-muted/40 text-sm font-medium text-muted-foreground border-b border-border" style={{ gridTemplateColumns: '60px 60px 2fr 100px 100px 100px 100px 80px' }}>
              <div className="text-center">Done</div>
              <div className="text-center">Star</div>
              <div>Chapter</div>
              <div className="text-center">Notes</div>
              <div className="text-center">Short</div>
              <div className="text-center">PYQs</div>
              <div className="text-center">Revision</div>
              <div className="text-center">Weightage</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-border">
              {sheet.chapters.map((chapter, index) => (
                <div 
                  key={chapter.id} 
                  className="grid gap-4 p-4 hover:bg-muted/20 transition-colors items-center"
                  style={{ gridTemplateColumns: '60px 60px 2fr 100px 100px 100px 100px 80px' }}
                >
                  {/* Complete Checkbox */}
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={chapter.isCompleted || false}
                      onCheckedChange={(checked) => 
                        onChapterToggle(sheet.id, chapter.id, checked as boolean)
                      }
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-none duration-75"
                    />
                  </div>

                  {/* Important Star */}
                  <div className="flex items-center justify-center">
                    {chapter.isImportant && (
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>

                  {/* Chapter Name */}
                  <div className="min-w-0">
                    <div className="font-medium text-foreground truncate">{chapter.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {chapter.resourceCount} resources
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="flex items-center justify-center">
                    {chapter.resources.handwrittenNotes && chapter.status === 'available' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-primary/10"
                        onClick={() => onChapterView(chapter.id)}
                        title="Handwritten Notes"
                      >
                        <FileText className="w-4 h-4 text-primary" />
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </div>

                  {/* Short Notes */}
                  <div className="flex items-center justify-center">
                    {chapter.resources.shortNotes && chapter.status === 'available' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-secondary/10"
                        onClick={() => onChapterView(chapter.id)}
                        title="Short Notes"
                      >
                        <Scroll className="w-4 h-4 text-secondary" />
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </div>

                  {/* PYQs */}
                  <div className="flex items-center justify-center">
                    {chapter.resources.pyqs && chapter.status === 'available' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-info/10"
                        onClick={() => onChapterDownload(chapter.id)}
                        title="Previous Year Questions"
                      >
                        <HelpCircle className="w-4 h-4 text-info" />
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </div>

                  {/* Revision */}
                  <div className="flex items-center justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-warning/10"
                      title="Mark for revision"
                    >
                      <RotateCcw className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>

                  {/* Weightage */}
                  <div className="flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">-</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};