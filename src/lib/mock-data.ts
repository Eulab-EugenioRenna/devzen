import type { Space } from './types';
import { Briefcase, Code, FileText, Bot } from 'lucide-react';

export const mockSpaces: Space[] = [
  { id: 'proj', name: 'Projects', icon: Briefcase },
  { id: 'devops', name: 'DevOps', icon: Code },
  { id: 'docs', name: 'Documentation', icon: FileText },
  { id: 'ai', name: 'AI/ML', icon: Bot },
];
