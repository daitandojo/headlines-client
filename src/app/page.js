import { Suspense } from 'react';
import { Header } from '@/components/Header';
import { ArticlesView } from '@/components/ArticlesView';

export default function HomePage({ searchParams }) {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <Header />
      <Suspense fallback={<div className="text-center text-slate-400 p-10">Loading Intelligence...</div>}>
        <ArticlesView searchParams={searchParams} />
      </Suspense>
    </div>
  );
}