// src/components/MainNavTabs.jsx (version 1.2)
"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Newspaper, UploadCloud, MessageSquare } from 'lucide-react';

const TABS = [
    { value: 'events', label: 'Events', icon: Zap },
    { value: 'articles', label: 'Articles', icon: Newspaper },
    { value: 'upload', label: 'Upload', icon: UploadCloud },
    { value: 'chat', label: 'Chat', icon: MessageSquare },
];

export function MainNavTabs() {
    const pathname = usePathname();
    const currentView = pathname.substring(1) || 'events';

    return (
        <Tabs value={currentView} className="w-full">
            <div className="flex justify-center">
                <TabsList className="h-12 rounded-full bg-slate-900/60 backdrop-blur-sm border border-slate-700/80 p-2 shadow-lg">
                    {TABS.map((tab) => (
                        <TabsTrigger key={tab.value} value={tab.value} asChild className="px-3 sm:px-6 rounded-full data-[state=active]:bg-blue-600/80 data-[state=active]:text-white">
                            <Link href={`/${tab.value}`} className="flex items-center gap-2">
                                <tab.icon className="h-4 w-4" />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </Link>
                        </TabsTrigger>
                    ))}
                </TabsList>
            </div>
        </Tabs>
    );
}