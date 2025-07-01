export type SpaceItem = Bookmark | Folder;

interface BaseItem {
  id: string;
  spaceId: string;
  parentId?: string | null;
  backgroundColor?: string;
  textColor?: string;
}

export interface Bookmark extends BaseItem {
  type: 'bookmark';
  title: string;
  url: string;
  summary?: string;
}

export interface Folder extends BaseItem {
  type: 'folder';
  name: string;
  items: Bookmark[];
}

export interface Space {
  id:string;
  name: string;
  icon: string;
}
