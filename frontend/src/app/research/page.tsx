'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ResearchView } from '@/components/dashboard/ResearchView';

export default function ResearchPage() {
  return (
    <AppLayout
      activeTab="research"
      onTabChange={(tab) => {
        window.location.href = tab === 'dashboard' ? '/dashboard' : `/${tab}`;
      }}
    >
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white">Research Studio</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Deep dive investigation workflows orchestrated by the Multi-Agent LangGraph supervisor.
          </p>
        </div>

        <ResearchView />
      </div>
    </AppLayout>
  );
}
