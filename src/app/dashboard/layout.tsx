import { handleLogout } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 w-full bg-background/80 backdrop-blur-sm">
        <div className="container flex items-center justify-end h-16">
          <form action={handleLogout}>
              <Button variant="ghost" size="icon">
                  <LogOut className="h-4 w-4"/>
                  <span className="sr-only">Logout</span>
              </Button>
          </form>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
