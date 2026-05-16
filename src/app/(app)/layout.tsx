import Sidebar, { MobileNav } from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
