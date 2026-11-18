'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { RefreshCwIcon } from '@/components/ui/Icons';
import { ProcessingJob, ProcessingStage } from '@/types';

interface ProcessingStatusCardProps {
  activeJobs: ProcessingJob[];
  onRefresh?: () => void;
}

const steps = [
  { id: 'parsing', label: '1. Parsing' },
  { id: 'chunking', label: '2. Chunking' },
  { id: 'embedding', label: '3. Embedding' },
  { id: 'indexing', label: '4. Indexing' },
];

export function ProcessingStatusCard({ activeJobs, onRefresh }: ProcessingStatusCardProps) {
  const getStageStep = (stage: ProcessingStage): number => {
    switch (stage) {
      case 'uploading': return 0;
      case 'parsing': return 1;
      case 'chunking': return 2;
      case 'embedding': return 3;
      case 'indexing': return 4;
      case 'completed': return 4;
      default: return 1;
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>Processing Pipeline</CardTitle>
              <Badge variant="warning" size="sm" dot>
                {activeJobs.length} active
              </Badge>
            </div>
            <CardDescription>
              Extraction, contextual chunking, embedding, and vector database indexing.
            </CardDescription>
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
              title="Refresh"
            >
              <RefreshCwIcon size={14} />
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Simple Step Breadcrumb */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-center text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
          {steps.map((s) => (
            <div key={s.id} className="py-1 px-1 truncate">
              {s.label}
            </div>
          ))}
        </div>

        {/* Active Jobs */}
        <div className="space-y-2.5">
          {activeJobs.length === 0 ? (
            <div className="p-4 text-center rounded-lg border border-neutral-100 dark:border-neutral-800 text-xs text-neutral-400">
              No documents currently processing.
            </div>
          ) : (
            activeJobs.map((job) => {
              const currentStepNumber = getStageStep(job.stage);

              return (
                <div
                  key={job.id}
                  className="p-3 rounded-lg border border-neutral-200/70 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate mr-2">
                      {job.documentName}
                    </span>
                    <Badge variant="neutral" size="sm">
                      Step {currentStepNumber}/4
                    </Badge>
                  </div>

                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mb-2 truncate">
                    {job.currentStepDescription}
                  </p>

                  <ProgressBar
                    value={job.progress}
                    size="sm"
                    color="neutral"
                    showPercentage
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Minimal metrics row */}
        <div className="grid grid-cols-3 pt-2 text-center border-t border-neutral-100 dark:border-neutral-800 text-xs">
          <div>
            <span className="text-[10px] text-neutral-400 block">Speed</span>
            <span className="font-medium text-neutral-700 dark:text-neutral-300">85 chunks/s</span>
          </div>
          <div>
            <span className="text-[10px] text-neutral-400 block">Latency</span>
            <span className="font-medium text-neutral-700 dark:text-neutral-300">140 ms</span>
          </div>
          <div>
            <span className="text-[10px] text-neutral-400 block">Status</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">Optimal</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
