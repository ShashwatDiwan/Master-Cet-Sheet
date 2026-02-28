import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Subject {
  id: string;
  name: string;
  color: string;
  count: number;
}

interface SubjectFilterProps {
  subjects: Subject[];
  activeSubject: string;
  onSubjectChange: (subjectId: string) => void;
}

export const SubjectFilter = ({ subjects, activeSubject, onSubjectChange }: SubjectFilterProps) => {
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant={activeSubject === 'all' ? 'default' : 'outline'}
        onClick={() => onSubjectChange('all')}
        className="rounded-full px-6"
      >
        All Subjects
        <Badge variant="secondary" className="ml-2">
          {subjects.reduce((total, subject) => total + subject.count, 0)}
        </Badge>
      </Button>
      
      {subjects.map((subject) => (
        <Button
          key={subject.id}
          variant={activeSubject === subject.id ? 'default' : 'outline'}
          onClick={() => onSubjectChange(subject.id)}
          className="rounded-full px-6"
        >
          {subject.name}
          <Badge variant="secondary" className="ml-2">
            {subject.count}
          </Badge>
        </Button>
      ))}
    </div>
  );
};