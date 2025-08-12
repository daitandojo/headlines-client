    
// src/app/(main)/upload/page.js (version 1.1)
import { UploadView } from '@/components/UploadView';
import { Header } from '@/components/Header';
import { MainNavTabs } from '@/components/MainNavTabs';

export default function UploadPage() {
    return (
        <div className="container mx-auto p-4 md:p-8 flex flex-col min-h-screen">
            <Header />
            <MainNavTabs />
            <main className="flex-grow flex flex-col mt-8">
                <UploadView />
            </main>
        </div>
    );
}

  

