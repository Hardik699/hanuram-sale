import TopNav from "./TopNav";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col transition-colors duration-300">
      <TopNav />
      <main className="flex-1 transition-colors duration-300">
        {children}
      </main>
    </div>
  );
}
