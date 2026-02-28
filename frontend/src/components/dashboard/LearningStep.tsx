import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Play, FileText, Star, Plus } from 'lucide-react';
import { ProblemRow } from './ProblemRow';

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

interface LearningStepProps {
  title: string;
  description: string;
  completed: number;
  total: number;
  problems: Problem[];
  isExpanded?: boolean;
  delay?: number;
}

export const LearningStep = ({ 
  title, 
  description, 
  completed, 
  total, 
  problems,
  isExpanded: initialExpanded = false,
  delay = 0
}: LearningStepProps) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const percentage = Math.round((completed / total) * 100);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <div className="w-4 h-4 rounded-full bg-easy flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-white" />
        </div>;
      case 'attempted':
        return <div className="w-4 h-4 rounded-full bg-medium" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-muted border-2 border-muted-foreground" />;
    }
  };

  return (
    <Card 
      className="overflow-hidden bg-gradient-card border-border/20 backdrop-blur-sm hover:shadow-elegant transition-all duration-500 hover:-translate-y-1 scroll-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div 
        className="p-6 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <Button
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-muted/20"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 transition-transform duration-300" />
              ) : (
                <ChevronRight className="w-4 h-4 transition-transform duration-300" />
              )}
            </Button>
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-1 font-poppins">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">{description}</p>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{total} problems</span>
                <span>•</span>
                <span>{completed} completed</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-foreground mb-1">
                {completed} / {total}
              </div>
              <div className="w-24 h-2 bg-muted/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-out"
                  style={{ 
                    width: `${percentage}%`,
                    filter: 'drop-shadow(0 0 4px hsl(var(--primary) / 0.5))'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-border/20 bg-card/50 animate-accordion-down">
          <div className="p-6 space-y-4">
            <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Problems
            </h4>
            
            <div className="space-y-2">
              {problems.map((problem, index) => (
                <ProblemRow 
                  key={problem.id} 
                  problem={problem}
                  delay={index * 100}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};