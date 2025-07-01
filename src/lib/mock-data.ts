import type { Bookmark, Space } from './types';
import { Briefcase, Code, FileText, Bot } from 'lucide-react';

export const mockSpaces: Space[] = [
  { id: 'proj', name: 'Projects', icon: Briefcase },
  { id: 'devops', name: 'DevOps', icon: Code },
  { id: 'docs', name: 'Documentation', icon: FileText },
  { id: 'ai', name: 'AI/ML', icon: Bot },
];

export const mockBookmarks: Bookmark[] = [
  {
    id: '1',
    title: 'Next.js Conf',
    url: 'https://nextjs.org/conf',
    summary: 'Conference for the Next.js and Vercel community.',
    spaceId: 'proj',
  },
  {
    id: '2',
    title: 'GitHub Actions',
    url: 'https://github.com/features/actions',
    summary: 'Automate your workflow from idea to production.',
    spaceId: 'devops',
  },
  {
    id: '3',
    title: 'Tailwind CSS Docs',
    url: 'https://tailwindcss.com/docs',
    summary: 'A utility-first CSS framework for rapid UI development.',
    spaceId: 'docs',
  },
  {
    id: '4',
    title: 'Firebase',
    url: 'https://firebase.google.com/',
    summary: 'An app development platform that helps you build and grow apps.',
    spaceId: 'proj',
  },
  {
    id: '5',
    title: 'Docker Official Images',
    url: 'https://hub.docker.com/_/official-images',
    summary: 'Curated list of Docker Official Images.',
    spaceId: 'devops',
  },
  {
    id: '6',
    title: 'MDN Web Docs',
    url: 'https://developer.mozilla.org/',
    summary: 'Resources for developers, by developers.',
    spaceId: 'docs',
  },
  {
    id: '7',
    title: 'Hugging Face',
    url: 'https://huggingface.co/',
    summary: 'The AI community building the future.',
    spaceId: 'ai',
  },
  {
    id: '8',
    title: 'Genkit Developer Guide',
    url: 'https://firebase.google.com/docs/genkit',
    summary:
      'The open-source framework for building AI-powered applications.',
    spaceId: 'ai',
  },
  {
    id: '9',
    title: 'Kubernetes',
    url: 'https://kubernetes.io/',
    summary: 'Production-Grade Container Orchestration.',
    spaceId: 'devops',
  },
];
