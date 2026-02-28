import { Card } from '@/components/ui/card';
import { BookOpen, Clock, CheckCircle } from 'lucide-react';

interface Chapter {
  id: string;
  name: string;
  resourceCount: number;
  status: 'available' | 'coming-soon';
  hasNotes: boolean;
  hasPractice: boolean;
}

interface SheetData {
  id: string;
  title: string;
  description: string;
  subject: string;
  totalChapters: number;
  availableChapters: number;
  totalResources: number;
  progress: number;
  chapters: Chapter[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  completedChapters: number;
}

interface CompactSheetCardProps {
  sheet: SheetData;
  onClick: () => void;
}

export const CompactSheetCard = ({ sheet, onClick }: CompactSheetCardProps) => {
  const progressPercentage = Math.round((sheet.completedChapters / sheet.totalChapters) * 100);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'text-green-600 bg-green-50 border-green-200';
      case 'Intermediate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Advanced': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  return (
    <Card 
      className="group cursor-pointer transition-all duration-300 hover:shadow-elegant hover:-translate-y-1 border-border bg-card"
      onClick={onClick}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
              {sheet.title}
            </h3>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                <span>{sheet.totalChapters} chapters</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                <span>{sheet.completedChapters} completed</span>
              </div>
            </div>
          </div>
          <div className={`px-2 py-1 rounded-md text-xs font-medium border ${getDifficultyColor(sheet.difficulty)}`}>
            {sheet.difficulty}
          </div>
        </div>

        {/* Progress Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-12 h-12">
              <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="3"
                />
                <path
                  d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  strokeDasharray={`${progressPercentage}, 100`}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">{progressPercentage}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Progress</p>
              <p className="text-xs text-muted-foreground">
                {sheet.completedChapters} of {sheet.totalChapters} chapters
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-lg font-bold text-primary">{sheet.totalResources}</p>
            <p className="text-xs text-muted-foreground">Resources</p>
          </div>
        </div>
      </div>
    </Card>
  );
};