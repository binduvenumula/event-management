import { Loader2 } from 'lucide-react';

// Centered spinner for page/section loading.
export default function Spinner({ label = 'Loading...', className = 'py-16' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 text-slate-500 ${className}`} role="status">
      <Loader2 className="h-8 w-8 animate-spin text-royal" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

// Grid of card skeletons shown while event/club lists load.
export function CardSkeletons({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card overflow-hidden">
          <div className="skeleton aspect-video rounded-none" />
          <div className="space-y-3 p-4">
            <div className="skeleton h-4 w-1/3" />
            <div className="skeleton h-5 w-4/5" />
            <div className="skeleton h-4 w-2/3" />
            <div className="skeleton h-9 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
