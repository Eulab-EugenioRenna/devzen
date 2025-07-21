import { getAppInfoAction, getToolsAiAction, getItemsAction, getSpacesAction } from '@/app/actions';
import { BookmarkDashboardProvider } from '@/components/bookmark-dashboard-provider';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({ userId }: { userId: string }) {
  const [items, spaces, appInfo, tools] = await Promise.all([
      getItemsAction(userId), 
      getSpacesAction(userId),
      getAppInfoAction(),
      getToolsAiAction(),
    ]);
  return <BookmarkDashboardProvider initialItems={items} initialSpaces={spaces} initialAppInfo={appInfo} initialTools={tools} />;
}
