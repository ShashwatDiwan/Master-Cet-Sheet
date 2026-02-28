import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Award, Target } from 'lucide-react';

interface SubjectProgress {
  subject: string;
  completed: number;
  total: number;
  color: string;
}

interface SingleProgressTrackerProps {
  subjects: SubjectProgress[];
}

export const SingleProgressTracker = ({ subjects }: SingleProgressTrackerProps) => {
  const totalCompleted = subjects.reduce((sum, subject) => sum + subject.completed, 0);
  const totalChapters = subjects.reduce((sum, subject) => sum + subject.total, 0);
  const overallProgress = Math.round((totalCompleted / totalChapters) * 100);
  
  const bestSubject = subjects.reduce((best, current) => {
    const currentProgress = (current.completed / current.total) * 100;
    const bestProgress = (best.completed / best.total) * 100;
    return currentProgress > bestProgress ? current : best;
  });

  const bestSubjectProgress = Math.round((bestSubject.completed / bestSubject.total) * 100);

  return (
    <Card className="p-6 border-border bg-gradient-card shadow-card mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Progress */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Target className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Overall Progress</h3>
          </div>
          <div className="relative w-24 h-24 mx-auto mb-3">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
              <path
                d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="2"
              />
              <path
                d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                strokeDasharray={`${overallProgress}, 100`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">{overallProgress}%</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {totalCompleted} of {totalChapters} chapters completed
          </p>
        </div>

        {/* Best Subject */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Award className="w-5 h-5 text-warning" />
            <h3 className="font-semibold text-foreground">Top Subject</h3>
          </div>
          <div className="mb-3">
            <p className="text-xl font-bold text-foreground">{bestSubject.subject}</p>
            <p className="text-2xl font-bold text-warning">{bestSubjectProgress}%</p>
          </div>
          <p className="text-sm text-muted-foreground">
            {bestSubject.completed} of {bestSubject.total} chapters
          </p>
        </div>

        {/* Subject Breakdown */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-success" />
            <h3 className="font-semibold text-foreground">Subject Breakdown</h3>
          </div>
          <div className="space-y-3">
            {subjects.map((subject) => {
              const percentage = Math.round((subject.completed / subject.total) * 100);
              return (
                <div key={subject.subject}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{subject.subject}</span>
                    <span className="text-sm text-muted-foreground">{percentage}%</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
};