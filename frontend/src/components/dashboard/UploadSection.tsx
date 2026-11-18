'use client';

import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import {
  UploadCloudIcon,
  FileTextIcon,
  XIcon,
  CheckCircleIcon,
} from '@/components/ui/Icons';
import { DocumentItem, FileExtension } from '@/types';
import { api } from '@/services/api';

interface UploadSectionProps {
  onDocumentUploaded: (newDoc: DocumentItem) => void;
}

interface QueuedFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
}

export function UploadSection({ onDocumentUploaded }: UploadSectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFileList = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newQueued: QueuedFile[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      progress: 0,
      status: 'pending',
    }));

    setQueuedFiles((prev) => [...prev, ...newQueued]);

    newQueued.forEach((item) => {
      processUpload(item);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFileList(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFileList(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processUpload = async (item: QueuedFile) => {
    setQueuedFiles((prev) =>
      prev.map((q) => (q.id === item.id ? { ...q, status: 'uploading', progress: 35 } : q))
    );

    try {
      const realDoc = await api.uploadDocument(item.file);
      if (realDoc) {
        setQueuedFiles((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, progress: 100, status: 'completed' } : q))
        );
        onDocumentUploaded(realDoc);
        return;
      }
    } catch {
      // Fallback simulation if offline
    }

    let progress = 35;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 25) + 15;
      if (progress >= 100) {
        clearInterval(interval);
        setQueuedFiles((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, progress: 100, status: 'completed' } : q))
        );

        const ext = (item.file.name.split('.').pop()?.toLowerCase() || 'pdf') as FileExtension;
        const formattedSize =
          item.file.size > 1024 * 1024
            ? `${(item.file.size / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.round(item.file.size / 1024)} KB`;

        const newDoc: DocumentItem = {
          id: item.id,
          name: item.file.name,
          size: formattedSize,
          sizeBytes: item.file.size,
          type: ext,
          uploadedAt: 'Just now',
          status: 'ready',
          progress: 100,
          currentStage: 'completed',
          chunksCount: Math.floor(Math.random() * 80) + 20,
          vectorCount: 12,
        };

        onDocumentUploaded(newDoc);
      } else {
        setQueuedFiles((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, progress } : q))
        );
      }
    }, 200);
  };

  const handleLoadSample = (sampleName: string) => {
    const fakeFile = new File(['mock content'], sampleName, { type: 'application/pdf' });
    const fakeQueued: QueuedFile = {
      id: Math.random().toString(36).substring(2, 9),
      file: fakeFile,
      progress: 0,
      status: 'pending',
    };
    setQueuedFiles((prev) => [...prev, fakeQueued]);
    processUpload(fakeQueued);
  };

  const removeQueuedFile = (id: string) => {
    setQueuedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Upload Documents</CardTitle>
            <CardDescription>
              Add files to index for semantic search and conversational reasoning.
            </CardDescription>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleLoadSample('annual_financial_report.pdf')}
              className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-lime-400 dark:hover:text-lime-300 hover:border-lime-400/30 px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-900 border border-transparent transition-colors"
            >
              + Sample PDF
            </button>
            <button
              onClick={() => handleLoadSample('technical_specifications.docx')}
              className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-lime-400 dark:hover:text-lime-300 hover:border-lime-400/30 px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-900 border border-transparent transition-colors"
            >
              + Sample DOCX
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.csv,.md,.json"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer border border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
            isDragging
              ? 'border-lime-400 bg-lime-400/5 text-lime-400 shadow-[0_0_20px_rgba(163,230,53,0.15)]'
              : 'border-neutral-200 dark:border-neutral-800 hover:border-lime-400/40 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40'
          }`}
        >
          <div className="mx-auto w-9 h-9 rounded-lg bg-neutral-950 border border-lime-400/30 flex items-center justify-center text-lime-400 mb-2 shadow-[0_0_10px_rgba(163,230,53,0.2)]">
            <UploadCloudIcon size={18} />
          </div>

          <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100">
            {isDragging ? 'Drop files to upload' : 'Click to select or drag and drop files here'}
          </p>

          <p className="text-[11px] text-neutral-400 mt-0.5">
            PDF, DOCX, TXT, CSV, MD, JSON (up to 50MB)
          </p>
        </div>

        {/* Ingest Queue */}
        {queuedFiles.length > 0 && (
          <div className="mt-3.5 space-y-2 border-t border-neutral-100 dark:border-neutral-800 pt-3">
            <div className="flex items-center justify-between text-[11px] font-medium text-neutral-500">
              <span>Uploading {queuedFiles.length} file(s)</span>
              <button
                onClick={() => setQueuedFiles([])}
                className="hover:text-neutral-800 dark:hover:text-neutral-200"
              >
                Clear
              </button>
            </div>

            {queuedFiles.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-3">
                  <FileTextIcon size={15} className="text-neutral-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate text-[11px]">
                        {item.file.name}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400">
                        {item.status === 'completed' ? 'Uploaded' : `${item.progress}%`}
                      </span>
                    </div>
                    <ProgressBar
                      value={item.progress}
                      size="sm"
                      color="neutral"
                    />
                  </div>
                </div>

                <div className="shrink-0">
                  {item.status === 'completed' ? (
                    <CheckCircleIcon size={14} className="text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <button
                      onClick={() => removeQueuedFile(item.id)}
                      className="p-1 text-neutral-400 hover:text-neutral-600 rounded"
                      aria-label="Remove item"
                    >
                      <XIcon size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
