// src/components/chat/ChatMessage.jsx (version 1.4)
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw'; // Re-import rehype-raw
import { cn } from '@/lib/utils';
import { User, Bot } from 'lucide-react';

const processTaggedContent = (content) => {
    // Replace custom tags with spans that have the correct class.
    // This is done on the string itself before passing it to the Markdown renderer.
    // The rehype-raw plugin will then correctly render these spans inline.
    let processedContent = content.replace(/<rag>/g, '<span class="rag-source">');
    processedContent = processedContent.replace(/<\/rag>/g, '</span>');
    processedContent = processedContent.replace(/<wiki>/g, '<span class="wiki-source">');
    processedContent = processedContent.replace(/<\/wiki>/g, '</span>');
    processedContent = processedContent.replace(/<llm>/g, '<span class="llm-source">');
    processedContent = processedContent.replace(/<\/llm>/g, '</span>');
    return processedContent;
};

export function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  
  return (
    <div className={cn('flex items-start gap-4', isUser && 'justify-end')}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center">
          <Bot className="h-5 w-5" />
        </div>
      )}
      <div className={cn(
          'px-4 py-3 rounded-xl max-w-[85%]',
          isUser ? 'bg-slate-700' : 'bg-slate-800'
      )}>
        <div className="overflow-x-auto custom-scrollbar">
            <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-2 prose-li:my-0 text-slate-200">
                {isUser ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                        {message.content}
                    </ReactMarkdown>
                ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                        {processTaggedContent(message.content)}
                    </ReactMarkdown>
                )}
            </div>
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