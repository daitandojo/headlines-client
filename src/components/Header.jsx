import { Briefcase } from 'lucide-react';

export const Header = () => {
  return (
    <header className="mb-8">
      <div className="flex flex-row sm:flex-row items-center justify-center gap-y-4 sm:gap-x-6 mb-3">
        
        <Briefcase size={32} className="text-blue-400 sm:size-12" />
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-100 text-center sm:text-left">
          Headlines<span className="hidden sm:inline"> Intelligence</span>
        </h1>
      </div>
      
      <p className="text-center text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
        Search, filter, and analyze<span className="hidden sm:inline"> curated wealth event articles.</span>
      </p>
    </header>
  );
};