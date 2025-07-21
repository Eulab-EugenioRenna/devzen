import { getAppInfoAction, getToolsAiAction, getItemsAction, getSpacesAction } from '@/app/actions';
import { BookmarkDashboardProvider } from '@/components/bookmark-dashboard-provider';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  console.log("--- CHECKPOINT 3 [DashboardPage] ---");
  console.log("Fetching initial data on the server...");
  const [items, spaces, appInfo, tools] = await Promise.all([
      getItemsAction(), 
      getSpacesAction(),
      getAppInfoAction(),
      getToolsAiAction(),
    ]);
  return <BookmarkDashboardProvider initialItems={items} initialSpaces={spaces} initialAppInfo={appInfo} initialTools={tools} />;
}
