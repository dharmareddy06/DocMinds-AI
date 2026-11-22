'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SparklesIcon, DocumentIcon } from '@/components/ui/Icons';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [workspace, setWorkspace] = useState('enterprise-default');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-900 border border-lime-500/40 text-lime-400 font-bold text-lg mb-2 shadow-[0_0_20px_rgba(163,230,53,0.15)]">
            DM
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">DocMind AI</h1>
          <p className="text-sm text-zinc-400">
            Enterprise Document Intelligence & Agentic RAG
          </p>
        </div>

        {/* Auth Card */}
        <Card className="p-6 border-zinc-800 bg-zinc-900/60 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Work Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@enterprise.ai"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-lime-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-lime-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Workspace ID
              </label>
              <input
                type="text"
                value={workspace}
                onChange={(e) => setWorkspace(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm font-mono text-lime-400 focus:outline-none focus:border-lime-500 transition-colors"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-lime-400 hover:bg-lime-500 text-black font-semibold py-2.5 mt-2"
            >
              Sign In to Workspace
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t border-zinc-800/80 text-center">
            <Link href="/dashboard" className="text-xs text-lime-400 hover:underline">
              Continue as Demo Enterprise Guest →
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
