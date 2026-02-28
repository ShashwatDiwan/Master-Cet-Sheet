import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, Clock, CheckCircle } from 'lucide-react';

interface Chapter {
  id: string;
  name: string;
  resourceCount: number;
  status: 'available' | 'coming-soon';
  hasNotes: boolean;
  hasPractice: boolean;
}

interface ChapterRowProps {
  chapter: Chapter;
  onView: (chapterId: string) => void;
  onDownload: (chapterId: string) => void;
}

export const ChapterRow = ({ chapter, onView, onDownload }: ChapterRowProps) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h4 className="font-medium text-foreground">{chapter.name}</h4>
          <div className="flex gap-2">
            {chapter.hasNotes && (
              <Badge variant="outline" className="text-xs">
                Notes
              </Badge>
            )}
            {chapter.hasPractice && (
              <Badge variant="outline" className="text-xs">
                Practice
              </Badge>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {chapter.resourceCount} resources available
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        <Badge 
          variant={chapter.status === 'available' ? 'default' : 'secondary'}
          className="flex items-center gap-1"
        >
          {chapter.status === 'available' ? (
            <CheckCircle className="w-3 h-3" />
          ) : (
            <Clock className="w-3 h-3" />
          )}
          {chapter.status === 'available' ? 'Available' : 'Coming Soon'}
        </Badge>
        
        {chapter.status === 'available' && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onView(chapter.id)}
              className="flex items-center gap-1"
            >
              <Eye className="w-4 h-4" />
              View
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDownload(chapter.id)}
              className="flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};