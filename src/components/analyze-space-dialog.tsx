'use client';

import * as React from 'react';
import type { Space, AnalyzeSpaceOutput } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Loader2, Lightbulb, Tags, FileText, X } from 'lucide-react';
import { Badge } from './ui/badge';

interface AnalyzeSpaceDialogProps {
  space: Space;
  result: AnalyzeSpaceOutput | null;
  onOpenChange: (open: boolean) => void;
}

const MarkdownContent: React.FC<{ content: string }> = ({ content }) => {
    const htmlContent = content
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
      .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(/(<li>.*<\/li>)/gs, '<ul class="list-disc pl-5 mb-4">$1</ul>');
  
    return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};
  

export function AnalyzeSpaceDialog({ space, result, onOpenChange }: AnalyzeSpaceDialogProps) {
  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Analisi dello Spazio: {space.name}</DialogTitle>
          <DialogDescription>
            L'AI ha analizzato il contenuto di questo spazio per fornirti approfondimenti.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto pr-4 space-y-6 py-4">
          {!result ? (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8">
              <Loader2 className="h-12 w-12 animate-spin mb-4" />
              <p className="text-lg font-medium">Analisi in corso...</p>
              <p>L'AI sta esaminando i tuoi segnalibri.</p>
            </div>
          ) : (
            <>
              <div>
                <h3 className="font-semibold text-lg flex items-center mb-2">
                    <FileText className="mr-2 h-5 w-5" />
                    Riepilogo Generale
                </h3>
                <div className="text-sm text-muted-foreground space-y-2 prose prose-sm dark:prose-invert max-w-none">
                    <MarkdownContent content={result.analysis} />
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg flex items-center mb-2">
                    <Tags className="mr-2 h-5 w-5" />
                    Temi Chiave
                </h3>
                <div className="flex flex-wrap gap-2">
                    {result.keyThemes.map((theme, index) => (
                        <Badge key={index} variant="secondary">{theme}</Badge>
                    ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg flex items-center mb-2">
                    <Lightbulb className="mr-2 h-5 w-5" />
                    Suggerimenti
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                    {result.suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                    ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
