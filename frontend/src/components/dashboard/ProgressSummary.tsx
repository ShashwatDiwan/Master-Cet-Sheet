import { BookOpen, Target, TrendingUp, Award } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { SubjectSheet } from '@/lib/cet-data';

interface ProgressSummaryProps {
  subjects: SubjectSheet[];
}

export const ProgressSummary = ({ subjects }: ProgressSummaryProps) => {
  const totalChapters = subjects.reduce((sum, subject) => sum + subject.totalChapters, 0);
  const completedChapters = subjects.reduce((sum, subject) => sum + subject.completedChapters, 0);
  const overallProgress = Math.round((completedChapters / totalChapters) * 100);
  
  const totalResources = subjects.reduce((sum, subject) => sum + subject.totalResources, 0);
  const availableResources = subjects.reduce((sum, subject) => {
    const availableChapters = subject.chapters.filter(ch => ch.status === 'available').length;
    return sum + (availableResources * subject.totalResources / subject.totalChapters);
  }, 0);

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-success';
    if (progress >= 60) return 'text-warning';
    if (progress >= 40) return 'text-info';
    return 'text-muted-foreground';
  };

  const getProgressVariant = (progress: number) => {
    if (progress >= 80) return 'default';
    if (progress >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      {/* Overall Progress Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Your CET Preparation Journey
        </h2>
        <p className="text-muted-foreground">
          Track your progress across all subjects and stay motivated!
        </p>
      </div>

      {/* Main Progress Card */}
      <Card className="p-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-4">
            <Target className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-2">
            {overallProgress}% Complete
          </h3>
          <p className="text-muted-foreground">
            {completedChapters} of {totalChapters} chapters completed
          </p>
        </div>
        
        <Progress 
          value={overallProgress} 
          className="h-3 mb-4"
          variant={getProgressVariant(overallProgress) as any}
        />
        
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary">{completedChapters}</p>
            <p className="text-sm text-muted-foreground">Chapters Done</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-secondary">{totalChapters - completedChapters}</p>
            <p className="text-sm text-muted-foreground">Chapters Left</p>
          </div>
        </div>
      </Card>

      {/* Subject-wise Progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {subjects.map((subject) => (
          <Card key={subject.id} className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-3 h-3 rounded-full ${
                subject.progress >= 80 ? 'bg-success' : 
                subject.progress >= 60 ? 'bg-warning' : 
                subject.progress >= 40 ? 'bg-info' : 'bg-muted'
              }`} />
              <h4 className="font-semibold text-foreground">{subject.subject}</h4>
            </div>
            
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Progress</span>
                <span className={`font-medium ${getProgressColor(subject.progress)}`}>
                  {subject.progress}%
                </span>
              </div>
              <Progress 
                value={subject.progress} 
                className="h-2"
                variant={getProgressVariant(subject.progress) as any}
              />
            </div>
            
            <div className="text-sm text-muted-foreground">
              {subject.completedChapters} / {subject.totalChapters} chapters
            </div>
          </Card>
        ))}
      </div>

      {/* Motivation Card */}
      {overallProgress > 0 && (
        <Card className="p-6 bg-gradient-to-r from-success/5 to-info/5 border-success/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
              <Award className="w-6 h-6 text-success" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">
                Great Progress! 🎉
              </h4>
              <p className="text-muted-foreground">
                You've completed {completedChapters} chapters. Keep up the momentum!
                {overallProgress >= 50 && " You're more than halfway there!"}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}; 