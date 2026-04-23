'use client';

import { useState } from 'react';
import GenerationTable from '@/components/admin/generation-table';
import { ContentGrid } from '@/components/admin/content-grid';

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState<'generations' | 'content'>('generations');

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">생성/콘텐츠</h1>
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('generations')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'generations'
              ? 'bg-[var(--accent)] text-white'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
          }`}
        >
          생성 작업
        </button>
        <button
          onClick={() => setActiveTab('content')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'content'
              ? 'bg-[var(--accent)] text-white'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
          }`}
        >
          콘텐츠
        </button>
      </div>
      {activeTab === 'generations' ? <GenerationTable /> : <ContentGrid />}
    </div>
  );
}
