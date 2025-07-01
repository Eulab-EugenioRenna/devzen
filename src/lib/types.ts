import type { LucideIcon } from "lucide-react";

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  summary?: string;
  spaceId: string;
}

export interface Space {
  id: string;
  name: string;
  icon: LucideIcon;
}
