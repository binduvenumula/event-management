import { Link } from 'react-router-dom';
import { ArrowRight, Users } from 'lucide-react';
import PosterImage from './PosterImage';
import { assetUrl, gradientFor } from '../utils/constants';

export default function ClubCard({ club }) {
  return (
    <Link to={`/clubs/${club.slug || club._id}`} className="card card-hover group flex flex-col overflow-hidden">
      <PosterImage src={club.banner} title={club.name} icon={Users} className="h-32 w-full" />
      <div className="relative flex flex-1 flex-col p-4 pt-9">
        <div className="absolute -top-7 left-4 flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border-4 border-white bg-white shadow">
          {club.logo ? (
            <img src={assetUrl(club.logo)} alt="" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          ) : (
            <span className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradientFor(club.name)} text-xl font-bold text-white`}>{club.name[0]}</span>
          )}
        </div>
        <div className="mb-1 flex items-center gap-2">
          <h3 className="truncate text-lg font-bold text-ink group-hover:text-royal">{club.name}</h3>
        </div>
        <span className="chip mb-2 self-start">{club.category}</span>
        <p className="line-clamp-3 text-sm text-muted">{club.description}</p>
        <div className="mt-auto flex items-center justify-between pt-4 text-sm">
          <span className="text-muted">{club.eventCount ?? 0} event{club.eventCount === 1 ? '' : 's'}</span>
          <span className="flex items-center gap-1 font-semibold text-royal">View club <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
        </div>
      </div>
    </Link>
  );
}
