import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getProgress } from '@/api/progress';
import { getSheets } from '@/api/sheets';
import { useNavigate } from 'react-router-dom';

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
    <div className="p-6">
      <div className="max-w-3xl mx-auto bg-[#0f1724] p-6 rounded-lg border border-zinc-800">
        <h2 className="text-2xl font-semibold text-white mb-2">Profile</h2>
        <p className="text-sm text-zinc-400 mb-4">Account information and learning statistics</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm text-zinc-400">Email</h3>
            <p className="text-white font-medium">{user?.email || '-'}</p>
          </div>
          <div>
            <h3 className="text-sm text-zinc-400">Username</h3>
            <p className="text-white font-medium">{user?.username || '-'}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#071023] p-4 rounded">
            <div className="text-zinc-400 text-sm">Overall Progress</div>
            <div className="text-white text-2xl font-bold">{overall}%</div>
          </div>

          <div className="bg-[#071023] p-4 rounded">
            <div className="text-zinc-400 text-sm">Chapters Completed</div>
            <div className="text-white text-2xl font-bold">{completed}</div>
          </div>

          <div className="bg-[#071023] p-4 rounded">
            <div className="text-zinc-400 text-sm">Tracked Chapters</div>
            <div className="text-white text-2xl font-bold">{totalChapters}</div>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-white font-semibold mb-2">Subject breakdown</h4>
          <ul className="text-sm text-zinc-300 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {subjectStats.map((s, idx) => (
              <li key={idx} className="py-1 border-b border-zinc-800 flex justify-between">
                <span>{s.subject}</span>
                <span>{s.progress}%</span>
              </li>
            ))}
            {subjectStats.length === 0 && <li className="text-zinc-500">No data.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Profile;
