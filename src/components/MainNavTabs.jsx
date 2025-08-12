"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = [
    { value: 'events', label: 'Events' },
    { value: 'articles', label: 'Articles' },
    { value: 'upload', label: 'Upload' },
    { value: 'chat', label: 'Chat' },
];

export function MainNavTabs() {
    const pathname = usePathname();
    // Example: if pathname is '/articles', this will be 'articles'.
    // If pathname is '/', it defaults to 'events'.
    const currentView = pathname.substring(1) || 'events';

    return (
        <Tabs value={currentView} className="w-full">
            <div className="flex justify-center">
                <TabsList className="grid w-full max-w-2xl grid-cols-4">
                    {TABS.map((tab) => (
                        <TabsTrigger key={tab.value} value={tab.value} asChild>
                            <Link href={`/${tab.value}`}>{tab.label}</Link>
                        </TabsTrigger>
                    ))}
                </TabsList>
            </div>
        </Tabs>
    );
}