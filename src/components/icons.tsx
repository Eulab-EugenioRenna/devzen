import type { SVGProps } from "react";
import * as LucideIcons from 'lucide-react';

export const Icons = {
  logo: (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 4h8a4 4 0 0 1 4 4v12a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-4" />
      <path d="M20 12V8a4 4 0 0 0-4-4H8" />
    </svg>
  ),
};

export const iconMap: { [key: string]: React.FC<any> } = {
  Logo: Icons.logo,
  Briefcase: LucideIcons.Briefcase,
  Code: LucideIcons.Code,
  FileText: LucideIcons.FileText,
  Bot: LucideIcons.Bot,
  Terminal: LucideIcons.Terminal,
  Database: LucideIcons.Database,
  Book: LucideIcons.Book,
  PenTool: LucideIcons.PenTool,
  Lightbulb: LucideIcons.Lightbulb,
  Globe: LucideIcons.Globe,
  NotebookPen: LucideIcons.NotebookPen,
};

export function getIcon(name: string | undefined): React.FC<LucideIcons.LucideProps> {
  const DefaultIcon = LucideIcons.Folder;
  if (!name) return DefaultIcon;
  
  const iconKey = name.charAt(0).toUpperCase() + name.slice(1);
  const IconComponent = iconMap[iconKey as keyof typeof iconMap];
  
  return IconComponent || DefaultIcon;
}
