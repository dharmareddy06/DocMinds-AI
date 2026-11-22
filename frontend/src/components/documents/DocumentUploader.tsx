'use client';

import React, { useRef, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UploadIcon, SparklesIcon } from '@/components/ui/Icons';
import { api } from '@/services/api';

interface DocumentUploaderProps {
  onUploadSuccess?: () => void;
}

export function DocumentUploader({ onUploadSuccess }: DocumentUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadError(null);
      await api.uploadDocument(file);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="p-6 border-dashed border-2 border-zinc-800 bg-zinc-950/60 hover:border-lime-500/50 transition-colors text-center">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,.csv,.xlsx,.md"
        onChange={handleFileChange}
        className="hidden"
      />
      <div className="flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-lime-500/30 flex items-center justify-center text-lime-400">
          <UploadIcon className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Upload Documents</h4>
          <p className="text-xs text-zinc-400 mt-1">
            Supports PDF, DOCX, CSV, XLSX, and TXT up to 50MB
          </p>
        </div>
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="bg-lime-400 hover:bg-lime-500 text-black font-semibold text-xs"
        >
          {isUploading ? 'Ingesting...' : 'Select File'}
        </Button>
        {uploadError && (
          <p className="text-xs text-red-400 mt-2">{uploadError}</p>
        )}
      </div>
    </Card>
  );
}
