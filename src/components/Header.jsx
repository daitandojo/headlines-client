import { Briefcase } from 'lucide-react';

export const Header = () => {
  return (
    <header className="mb-6">
      {/* Flex container to align the icon and title horizontally and center them */}
      <div className="flex items-center justify-center gap-x-6 mb-3">
        {/* The icon's styled box */}
        <div className="p-4 bg-slate-800/50 border border-slate-600 rounded-xl shadow-2xl shadow-blue-500/20">
          <Briefcase size={48} className="text-blue-400" />
        </div>
        
        {/* The main title */}
        <h1 className="text-5xl font-extrabold tracking-tight text-slate-100 sm:text-6xl">
          Headlines Intelligence
        </h1>
      </div>
      
      {/* The centered subtitle */}
      <p className="text-center text-lg text-slate-300 max-w-2xl mx-auto">
        Search, filter, and analyze curated wealth event articles.
      </p>
    </header>
  );
};