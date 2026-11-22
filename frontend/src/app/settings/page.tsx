'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CheckCircleIcon, SparklesIcon, SettingsIcon } from '@/components/ui/Icons';

export default function SettingsPage() {
  return (
    <AppLayout
      activeTab="settings"
      onTabChange={(tab) => {
        window.location.href = tab === 'dashboard' ? '/dashboard' : `/${tab}`;
      }}
    >
      <div className="space-y-6 max-w-4xl">
        <div>
          <h2 className="text-xl font-bold text-white">Platform Settings</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Configure LLM inference, embedding parameters, database connection, and observability.
          </p>
        </div>

        {/* LLM Provider Card */}
        <Card className="p-5 border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center space-x-3">
              <SparklesIcon className="w-5 h-5 text-lime-400" />
              <div>
                <h3 className="text-sm font-semibold text-white">LLM Provider (Groq AI)</h3>
                <p className="text-xs text-zinc-400">High-speed inference via Groq LPU</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-lime-950/30 text-lime-400 border-lime-500/30">
              Active • openai/gpt-oss-120b
            </Badge>
          </div>
          <div className="mt-4 space-y-3 text-xs text-zinc-300">
            <div className="flex justify-between py-1.5 border-b border-zinc-800/60">
              <span className="text-zinc-500">API Endpoint</span>
              <span className="font-mono">https://api.groq.com/openai/v1</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-zinc-800/60">
              <span className="text-zinc-500">Default Model</span>
              <span className="font-mono text-lime-400">openai/gpt-oss-120b (Fallback: qwen3.8-27b)</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-zinc-500">Status</span>
              <span className="flex items-center text-lime-400 font-medium">
                <CheckCircleIcon className="w-3.5 h-3.5 mr-1" />
                Live & Grounded
              </span>
            </div>
          </div>
        </Card>

        {/* Retrieval & Vector Settings */}
        <Card className="p-5 border-zinc-800 bg-zinc-900/60">
          <div className="pb-4 border-b border-zinc-800">
            <h3 className="text-sm font-semibold text-white">RAG & Retrieval Configuration</h3>
            <p className="text-xs text-zinc-400">Chunking, embedding model, and hybrid reranking</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-zinc-500 mb-1">Embedding Model</div>
              <div className="font-mono text-zinc-200">sentence-transformers/all-MiniLM-L6-v2</div>
            </div>
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-zinc-500 mb-1">Cross-Encoder Reranker</div>
              <div className="font-mono text-zinc-200">cross-encoder/ms-marco-MiniLM-L-6-v2</div>
            </div>
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-zinc-500 mb-1">Chunk Size / Overlap</div>
              <div className="font-mono text-zinc-200">800 chars / 120 chars</div>
            </div>
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-zinc-500 mb-1">Fusion Strategy</div>
              <div className="font-mono text-zinc-200">Reciprocal Rank Fusion (k=60)</div>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
