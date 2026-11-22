'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { UploadSection } from '@/components/dashboard/UploadSection';
import { ProcessingStatusCard } from '@/components/dashboard/ProcessingStatusCard';
import { RecentDocuments } from '@/components/dashboard/RecentDocuments';
import { useDocuments } from '@/hooks/useDocuments';

export default function DashboardPage() {
  const { documents, refreshDocuments, deleteDocument } = useDocuments();

  return (
    <AppLayout
      currentTab="dashboard"
      onSelectTab={(tab) => {
        window.location.href = tab === 'dashboard' ? '/dashboard' : `/${tab}`;
      }}
    >
      <div className="space-y-6">
        <StatsOverview documents={documents} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <UploadSection onDocumentUploaded={() => refreshDocuments()} />
            <RecentDocuments
              documents={documents}
              onStartChatWithDoc={() => {
                window.location.href = '/chat';
              }}
              onDeleteDoc={(id) => deleteDocument(id)}
            />
          </div>
          <div className="space-y-6">
            <ProcessingStatusCard activeJobs={[]} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
