import { Header } from '@/components/Header';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark font-display">
            <Header />
            <main className="flex-1 w-full mx-auto">
                {children}
            </main>
        </div>
    );
}
