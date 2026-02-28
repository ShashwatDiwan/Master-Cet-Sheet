import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';

interface DifficultyProgressProps {
  difficulty: 'Easy' | 'Medium' | 'Hard';
  completed: number;
  total: number;
  color: 'easy' | 'medium' | 'hard';
  delay?: number;
}

export const DifficultyProgress = ({ 
  difficulty, 
  completed, 
  total, 
  color,
  delay = 0 
}: DifficultyProgressProps) => {
  const percentage = Math.round((completed / total) * 100);
  
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'easy':
        return 'from-easy to-green-400';
      case 'medium':
        return 'from-medium to-yellow-400';
      case 'hard':
        return 'from-hard to-red-400';
      default:
        return 'from-primary to-primary';
    }
  };

  return (
    <Card className="p-6 bg-gradient-card border-border/20 backdrop-blur-sm hover:shadow-elegant transition-all duration-500 hover:-translate-y-2 scroll-fade-in">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">{difficulty}</h3>
          <span className="text-2xl font-bold text-foreground">
            {completed} / {total}
          </span>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground">{percentage}%</span>
          </div>
          
          <div className="relative">
            <Progress 
              value={percentage} 
              className="h-3 bg-muted/20"
              style={{
                animationDelay: `${delay}ms`
              }}
            />
            <div 
              className={`absolute top-0 left-0 h-3 rounded-full bg-gradient-to-r ${getColorClasses(color)} transition-all duration-1000 ease-out glow-effect`}
              style={{
                width: `${percentage}%`,
                animationDelay: `${delay}ms`,
                filter: `drop-shadow(0 0 8px hsl(var(--${color}) / 0.6))`
              }}
            />
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground">
          completed
        </div>
      </div>
    </Card>
  );
};