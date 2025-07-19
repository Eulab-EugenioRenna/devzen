
'use client';

import * as React from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { Markdown } from 'tiptap-markdown';
import {
  Bold, Italic, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, Link2, Eraser, Sparkles, Languages, Pilcrow, BrainCircuit, MessageSquareQuote, Check, Loader2, ChevronDown, Eye
} from 'lucide-react';
import {
  correctTextAction,
  summarizeTextAction,
  translateTextAction,
  improveTextAction,
  generateTextAction
} from '@/app/actions';

import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from '@/hooks/use-toast';
import { FullscreenPreviewDialog } from './fullscreen-preview-dialog';


interface RichTextEditorProps {
  content: string;
  onChange: (markdown: string) => void;
}

const EditorToolbar = ({ editor }: { editor: Editor | null }) => {
  const [isAiLoading, setIsAiLoading] = React.useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const { toast } = useToast();
  
  const setLink = React.useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  const handleAiAction = async (action: (text: string, ...args: any[]) => Promise<string>, ...args: any[]) => {
    setIsAiLoading(true);
    try {
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to, ' ');

      const textToProcess = selectedText.trim().length > 0 ? selectedText : editor.storage.markdown.getMarkdown();
      
      if (textToProcess.trim().length === 0) {
        toast({
          variant: 'destructive',
          title: "Nessun testo da elaborare",
          description: "Scrivi o seleziona del testo per usare le azioni AI.",
        });
        return;
      }
      
      const result = await action(textToProcess, ...args);

      if (selectedText.trim().length > 0) {
        editor.chain().focus().insertContentAt({ from, to }, result).run();
      } else {
        editor.chain().focus().selectAll().insertContent(result).run();
      }
    } catch (e) {
      console.error("AI Action failed:", e);
      const errorMessage = e instanceof Error ? e.message : "Si è verificato un errore sconosciuto.";
       toast({
        variant: 'destructive',
        title: "Azione AI Fallita",
        description: errorMessage,
      });
    } finally {
      setIsAiLoading(false);
    }
  };
  
  const handleGenerate = async () => {
    let promptText: string | null = '';
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');

    if (selectedText.trim().length > 0) {
      promptText = selectedText;
    } else {
      promptText = editor.storage.markdown.getMarkdown();
    }
    
    if (!promptText.trim()) {
      promptText = window.prompt("Descrivi cosa vuoi generare:");
    }
    
    if (!promptText) return;

    setIsAiLoading(true);
    try {
      const result = await generateTextAction(promptText);
       if (selectedText.trim().length > 0) {
        editor.chain().focus().insertContentAt({ from, to }, result).run();
      } else {
        editor.chain().focus().selectAll().insertContent(result).run();
      }
    } catch(e) {
       console.error("AI Generation failed:", e);
       toast({ variant: 'destructive', title: "Generazione Fallita" });
    } finally {
      setIsAiLoading(false);
    }
  };


  return (
    <>
    {isPreviewOpen && (
        <FullscreenPreviewDialog
            content={editor.storage.markdown.getMarkdown()}
            onOpenChange={setIsPreviewOpen}
        />
    )}
    <div className="border border-input rounded-t-md p-1 flex flex-wrap items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost" disabled={isAiLoading}>
            {isAiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span className='ml-2'>Azioni AI</span>
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleAiAction(correctTextAction)}>
            <Check className="mr-2 h-4 w-4"/> Correggi Testo
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAiAction(summarizeTextAction)}>
            <MessageSquareQuote className="mr-2 h-4 w-4"/> Riassumi
          </DropdownMenuItem>
           <DropdownMenuItem onClick={() => handleAiAction(improveTextAction)}>
            <BrainCircuit className="mr-2 h-4 w-4"/> Migliora Scrittura
          </DropdownMenuItem>
           <DropdownMenuItem onClick={() => handleAiAction(translateTextAction, 'English')}>
            <Languages className="mr-2 h-4 w-4"/> Traduci in Inglese
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleGenerate}>
            <Pilcrow className="mr-2 h-4 w-4"/> Genera con AI...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={() => setIsPreviewOpen(true)}
        title="Anteprima"
      >
        <Eye className="h-4 w-4" />
      </Button>

      <div className="h-6 w-px bg-border mx-1"/>

      <div className="flex items-center gap-1">
        <Button
            type="button"
            size="icon"
            variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            title="Grassetto"
        >
            <Bold className="h-4 w-4" />
        </Button>
        <Button
            type="button"
            size="icon"
            variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            title="Corsivo"
        >
            <Italic className="h-4 w-4" />
        </Button>
        <Button
            type="button"
            size="icon"
            variant={editor.isActive('strike') ? 'secondary' : 'ghost'}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={!editor.can().chain().focus().toggleStrike().run()}
            title="Barrato"
        >
            <Strikethrough className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="h-6 w-px bg-border mx-1"/>
      
      <div className="flex items-center gap-1">
        <Button
            type="button"
            size="icon"
            variant={editor.isActive('heading', { level: 1 }) ? 'secondary' : 'ghost'}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            title="Titolo 1"
        >
            <Heading1 className="h-4 w-4" />
        </Button>
        <Button
            type="button"
            size="icon"
            variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="Titolo 2"
        >
            <Heading2 className="h-4 w-4" />
        </Button>
        <Button
            type="button"
            size="icon"
            variant={editor.isActive('heading', { level: 3 }) ? 'secondary' : 'ghost'}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            title="Titolo 3"
        >
            <Heading3 className="h-4 w-4" />
        </Button>
      </div>

      <div className="h-6 w-px bg-border mx-1"/>

      <div className="flex items-center gap-1">
        <Button
            type="button"
            size="icon"
            variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Elenco Puntato"
        >
            <List className="h-4 w-4" />
        </Button>
        <Button
            type="button"
            size="icon"
            variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Elenco Numerato"
        >
            <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
            type="button"
            size="icon"
            variant={editor.isActive('link') ? 'secondary' : 'ghost'}
            onClick={setLink}
            title="Link"
        >
            <Link2 className="h-4 w-4" />
        </Button>
       </div>
       <div className="h-6 w-px bg-border mx-1"/>

       <div className="flex items-center gap-1">
        <Button
            type="button"
            size="icon"
            variant='ghost'
            onClick={() => editor.chain().focus().unsetAllMarks().run()}
            title="Rimuovi Formattazione"
        >
            <Eraser className="h-4 w-4" />
        </Button>
       </div>
    </div>
    </>
  );
};

export const RichTextEditor = ({ content, onChange }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Markdown.configure({
        html: false, 
        tightLists: true,
        tightListClass: "tight",
        bulletListMarker: "*",
      }),
    ],
    content: content,
    editorProps: {
      attributes: {
        class: cn(
          'w-full rounded-b-md border border-t-0 border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          'prose dark:prose-invert prose-sm sm:prose-base max-w-none h-full'
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.storage.markdown.getMarkdown());
    },
  });

  React.useEffect(() => {
    if (editor && !editor.isDestroyed) {
      const markdown = editor.storage.markdown.getMarkdown();
      if (markdown !== content) {
        editor.commands.setContent(content, false);
      }
    }
  }, [content, editor]);

  return (
    <div className='flex flex-col flex-grow'>
      <EditorToolbar editor={editor} />
      <div className="relative flex-grow overflow-y-auto">
        <EditorContent editor={editor} className="absolute inset-0" />
      </div>
    </div>
  );
};
