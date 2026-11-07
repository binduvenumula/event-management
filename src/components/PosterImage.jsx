import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { assetUrl, gradientFor } from '../utils/constants';

// Poster / banner image with a gradient placeholder when missing or broken.
export default function PosterImage({ src, title = '', className = '', icon: Icon = CalendarDays }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br ${gradientFor(title)} ${className}`} aria-label={title}>
        <Icon className="h-10 w-10 text-white/70" />
      </div>
    );
  }
  return <img src={assetUrl(src)} alt={title} loading="lazy" onError={() => setFailed(true)} className={`object-cover ${className}`} />;
}
