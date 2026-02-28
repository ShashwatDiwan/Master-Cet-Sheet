import { Card } from '@/components/ui/card';

interface CircularProgressProps {
  value: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export const CircularProgress = ({ 
  value, 
  total, 
  size = 120, 
  strokeWidth = 8,
  label = "Progress"
}: CircularProgressProps) => {
  const percentage = Math.round((value / total) * 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center animate-bounce-in">
      <svg 
        width={size} 
        height={size} 
        className="transform -rotate-90 transition-all duration-1000 ease-out"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          className="opacity-20"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
          style={{
            filter: 'drop-shadow(0 0 8px hsl(var(--primary) / 0.6))'
          }}
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground animate-fade-in">
          {percentage}%
        </span>
        <span className="text-xs text-muted-foreground animate-fade-in" style={{ animationDelay: '0.2s' }}>
          {value} / {total}
        </span>
      </div>
    </div>
  );
};