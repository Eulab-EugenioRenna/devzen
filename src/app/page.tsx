import type { AppInfo, Space, SpaceItem, ToolsAi } from '@/lib/types';
import { BookmarkDashboard } from '@/components/bookmark-dashboard';
import { getAppInfoAction, getToolsAiAction, getItemsAction, getSpacesAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [items, spaces, appInfo, tools] = await Promise.all([
      getItemsAction(), 
      getSpacesAction(),
      getAppInfoAction(),
      getToolsAiAction(),
    ]);
  return <BookmarkDashboard initialItems={items} initialSpaces={spaces} initialAppInfo={appInfo} initialTools={tools} />;
}
