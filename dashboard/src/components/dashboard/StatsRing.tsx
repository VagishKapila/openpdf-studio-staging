/**
 * Circular progress ring for displaying a percentage metric.
 */

interface StatsRingProps {
  value: number;       // 0–100
  label: string;
  color?: string;
  size?: number;
}

export function StatsRing({ value, label, color = '#6366F1', size = 120 }: StatsRingProps) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, value));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-gray-100 dark:text-gray-700"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* Center label overlaid */}
      <div className="relative -mt-[calc(50%+16px)] flex flex-col items-center justify-center" style={{ height: size }}>
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{clamped}%</span>
        <span className="text-xs text-gray-400">{label}</span>
      </div>
    </div>
  );
}
