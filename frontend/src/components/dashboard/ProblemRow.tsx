import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, FileText, Star, Lock, Eye, Download, Plus } from 'lucide-react';

interface Problem {
  id: string;
  title: string;
  status: 'completed' | 'attempted' | 'not-started';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  hasVideo: boolean;
  hasNotes: boolean;
  isPremium: boolean;
  isStarred: boolean;
}

interface ProblemRowProps {
  problem: Problem;
  delay?: number;
}

export const ProblemRow = ({ problem, delay = 0 }: ProblemRowProps) => {
  const getStatusIcon = () => {
    switch (problem.status) {
      case 'completed':
        return (
          <div className="w-5 h-5 rounded-full bg-easy flex items-center justify-center glow-effect">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
        );
      case 'attempted':
        return (
          <div className="w-5 h-5 rounded-full bg-medium flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white opacity-70" />
          </div>
        );
      default:
        return (
          <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/40 bg-transparent" />
        );
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'text-easy border-easy/20 bg-easy/10';
      case 'Medium':
        return 'text-medium border-medium/20 bg-medium/10';
      case 'Hard':
        return 'text-hard border-hard/20 bg-hard/10';
      default:
        return 'text-muted-foreground border-muted/20 bg-muted/10';
    }
  };

  return (
    <div 
      className="flex items-center justify-between p-4 rounded-lg border border-border/20 bg-card/30 hover:bg-card/50 transition-all duration-300 hover:shadow-soft animate-fade-in hover-scale"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-4 flex-1">
        {getStatusIcon()}
        
        <div className="flex-1">
          <h5 className="font-medium text-foreground hover:text-primary transition-colors cursor-pointer story-link">
            {problem.title}
          </h5>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Solve Button */}
        <Button
          size="sm"
          variant={problem.status === 'completed' ? 'secondary' : 'default'}
          className="text-xs px-3 py-1 hover:scale-105 transition-transform"
        >
          {problem.status === 'completed' ? 'Solved' : 'Solve'}
        </Button>

        {/* Resource Icons */}
        <div className="flex items-center gap-2">
          {problem.hasVideo && (
            <Button
              size="sm"
              variant="outline"
              className="p-2 hover:bg-primary/10 hover:border-primary/20"
            >
              <Play className="w-3 h-3" />
            </Button>
          )}
          
          {problem.hasNotes && (
            <Button
              size="sm"
              variant="outline"
              className="p-2 hover:bg-accent/10 hover:border-accent/20"
            >
              <FileText className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Practice/Note Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="p-2 hover:bg-muted/20"
          >
            <span className="text-muted-foreground">-</span>
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            className="p-2 hover:bg-primary/10"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>

        {/* Star */}
        <Button
          size="sm"
          variant="ghost"
          className={`p-2 transition-colors ${
            problem.isStarred 
              ? 'text-warning hover:text-warning/80' 
              : 'text-muted-foreground hover:text-warning'
          }`}
        >
          <Star className={`w-4 h-4 ${problem.isStarred ? 'fill-current' : ''}`} />
        </Button>

        {/* Difficulty Badge */}
        <Badge 
          variant="outline" 
          className={`text-xs ${getDifficultyColor(problem.difficulty)}`}
        >
          {problem.difficulty}
        </Badge>
      </div>
    </div>
  );
};