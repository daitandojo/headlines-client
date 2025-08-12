import { Sparkles } from 'lucide-react';

export function ChatThinkingIndicator({ status }) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-400">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center">
        <Sparkles className="h-5 w-5 text-yellow-400 animate-pulse" />
      </div>
      <div className="p-2 rounded-lg">
        <p className="italic">{status}</p>
      </div>
    </div>
  );
}