
'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from './ui/scroll-area';

interface FullscreenPreviewDialogProps {
  content: string;
  onOpenChange: (open: boolean) => void;
}

const MarkdownContent: React.FC<{ content: string }> = ({ content }) => {
    // This simple parser is for demonstration. For production, a library like 'marked' or 'react-markdown' would be more robust.
    const htmlContent = content
      .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mt-6 mb-3">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-semibold mt-5 mb-2.5">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-xl font-medium mt-4 mb-2">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)+/gms, (match) => `<ul class="list-disc pl-6 my-4 space-y-1">${match}</ul>`)
      .replace(/^1\. (.*$)/gm, '<li value="1">$1</li>') // Simple ordered list start
      .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
      .replace(/(<li.*<\/li>)+/gms, (match) => {
        if(match.includes('value="1"')) {
            return `<ol class="list-decimal pl-6 my-4 space-y-1">${match.replace(/<li value="1">/g, '<li>')}</ol>`
        }
        return match; // return unordered list if it's not the start of an ordered one
      })
      .replace(/`([^`]+)`/g, '<code class="bg-muted text-muted-foreground font-mono px-1.5 py-1 rounded-sm text-sm">$1</code>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary/80">$1</a>')
      .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="rounded-lg my-4 max-w-full h-auto" />')
      .replace(/\n/g, '<br />')
      .replace(/<br \s*\/?>\s*<br \s*\/?>/g, '<br />') // Compact multiple line breaks
      .replace(/<br \/>(\s*<(h1|h2|h3|ul|ol))/g, '$1'); // Remove line break before block elements

  return <div className="prose prose-lg dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};


export function FullscreenPreviewDialog({ content, onOpenChange }: FullscreenPreviewDialogProps) {
  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-2 sm:p-4">
        <DialogHeader className='sr-only'>
            <DialogTitle>Anteprima Nota</DialogTitle>
        </DialogHeader>
          <ScrollArea className="h-full w-full rounded-md border">
              <div className='p-6 sm:p-10'>
                  {content ? <MarkdownContent content={content} /> : <p className='text-muted-foreground'>L'anteprima apparirà qui.</p>}
              </div>
          </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
