import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface SubjectProgress {
  subject: string;
  completed: number;
  total: number;
  color: string;
}

interface SubjectProgressTrackerProps {
  subjects: SubjectProgress[];
}

export const SubjectProgressTracker = ({ subjects }: SubjectProgressTrackerProps) => {
  return (
    <Card className="p-6 glass-effect border-border/20 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {subjects.map((subject) => {
          const percentage = Math.round((subject.completed / subject.total) * 100);
          
          return (
            <div key={subject.subject} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground">{subject.subject}</h3>
                <span className="text-sm text-muted-foreground">
                  {subject.completed}/{subject.total}
                </span>
              </div>
              
              <Progress 
                value={percentage} 
                className="h-2"
              />
              
              <div className="text-center">
                <span className="text-lg font-bold text-gradient">
                  {percentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};