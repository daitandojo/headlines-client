import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { User, Bot, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function ChatMessage({ message, verifiedContent }) {
  const isUser = message.role === 'user';
  
  const renderContent = () => {
    if (verifiedContent) {
        // If we have verified content, render it with verification styles
        return verifiedContent.map((claim, index) => {
            if (claim.isVerified) {
                return (
                    <span key={index} className="text-yellow-300">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{claim.text}</ReactMarkdown>
                    </span>
                );
            } else {
                return (
                    <TooltipProvider key={index}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="text-slate-400 line-through decoration-red-500/80 decoration-2">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{claim.text}</ReactMarkdown>
                                </span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-slate-800 border-slate-700 text-slate-200">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                    <p>Verification failed against database.</p>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                );
            }
        });
    }
    // Otherwise, render the raw message content as it streams in
    return <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>;
  };

  return (
    <div className={cn('flex items-start gap-4', isUser && 'justify-end')}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center">
          <Bot className="h-5 w-5" />
        </div>
      )}
      <div className={cn(
          'px-4 py-3 rounded-xl max-w-2xl',
          isUser ? 'bg-slate-700' : 'bg-slate-800'
      )}>
        <div className="prose prose-sm prose-invert prose-p:my-1 prose-headings:my-2 prose-ul:my-2 prose-li:my-0 text-slate-200">
            {renderContent()}
        </div>
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-500/20 text-slate-300 flex items-center justify-center">
          <User className="h-5 w-5" />
        </div>
      )}
    </div>
  );
}