import { Header } from '@/components/Header';
import { MainNavTabs } from '@/components/MainNavTabs';

export default function MainLayout({ children }) {
    return (
        <div className="container mx-auto p-4 md:p-8">
            <Header />
            <MainNavTabs />
            <main className="mt-8">
                {children}
            </main>
        </div>
    );
}