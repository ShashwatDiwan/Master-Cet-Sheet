import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getProgress } from '@/api/progress';
import { getSheets } from '@/api/sheets';
import { useNavigate } from 'react-router-dom';
import { User, BookOpen, CheckCircle2, BarChart3, Mail, AtSign } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<any[]>([]);
  const [subjectStats, setSubjectStats] = useState<{subject:string; progress:number;}[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const p = await getProgress();
        setProgress(p || []);
      } catch {
        setProgress([]);
      }

      try {
        const sheets = await getSheets();
        const stats = sheets.map(s => ({ subject: s.subject, progress: s.progress || 0 }));
        setSubjectStats(stats);
      } catch {
        setSubjectStats([]);
      }
    })();
  }, []);

  const totalChapters = progress.length;
  const completed = progress.filter(p => p.completed).length;
  const overall = totalChapters ? Math.round((completed / totalChapters) * 100) : 0;

  return (
    <div className="p-6 bg-background min-h-[calc(100vh-3.5rem)]">
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
        {/* Profile Header */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground font-poppins">{user?.username || 'Profile'}</h2>
              <p className="text-sm text-muted-foreground">Account information and learning statistics</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium text-foreground">{user?.email || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <AtSign className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Username</p>
                <p className="text-sm font-medium text-foreground">{user?.username || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border p-5 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Overall Progress</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{overall}%</p>
          </div>

          <div className="bg-card border border-border p-5 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-sm text-muted-foreground">Completed</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{completed}</p>
          </div>

          <div className="bg-card border border-border p-5 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-amber-500" />
              </div>
              <span className="text-sm text-muted-foreground">Tracked Chapters</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{totalChapters}</p>
          </div>
        </div>

        {/* Subject Breakdown */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h4 className="text-foreground font-semibold mb-4 font-poppins">Subject Breakdown</h4>
          {subjectStats.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {subjectStats.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-foreground">{s.subject}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${s.progress}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground w-10 text-right">{s.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No data available yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
