import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BookOpen } from 'lucide-react';

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
}

interface SheetCardProps {
  sheet: SheetData;
  onClick: () => void;
}

export const SheetCard = ({ sheet, onClick }: SheetCardProps) => {
  return (
    <Card 
      className="overflow-hidden shadow-soft hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 bg-card border-border cursor-pointer"
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-foreground font-poppins mb-3">{sheet.title}</h3>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                <span>{sheet.totalChapters} chapters</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground">
              {sheet.availableChapters}/{sheet.totalChapters}
            </span>
          </div>
          <Progress value={sheet.progress} className="h-2" />
        </div>
      </div>
    </Card>
  );
};