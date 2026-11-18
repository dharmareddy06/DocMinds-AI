'use client';

import React from 'react';
import { NavigationTab } from '@/types';
import {
  MenuIcon,
  SearchIcon,
  BellIcon,
  SparklesIcon,
} from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';

interface HeaderProps {
  currentTab: NavigationTab;
  onOpenSidebar: () => void;
  onStartConversation: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const tabTitles: Record<NavigationTab, { title: string }> = {
  dashboard: { title: 'Overview' },
  documents: { title: 'Documents' },
  conversations: { title: 'Conversations' },
  pipelines: { title: 'Pipelines' },
  analytics: { title: 'Analytics' },
  settings: { title: 'Settings' },
};

export function Header({
  currentTab,
  onOpenSidebar,
  onStartConversation,
  searchQuery,
  onSearchChange,
}: HeaderProps) {
  const currentInfo = tabTitles[currentTab] || tabTitles.dashboard;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 sm:px-6 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 transition-colors">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-1.5 rounded-md text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:outline-none"
          aria-label="Open sidebar"
        >
          <MenuIcon size={18} />
        </button>

        {/* View Title */}
        <h1 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {currentInfo.title}
        </h1>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search Bar */}
        <div className="relative hidden md:flex items-center">
          <SearchIcon
            size={14}
            className="absolute left-2.5 text-neutral-400 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search documents, chunks..."
            className="w-48 lg:w-60 pl-8 pr-8 py-1.5 text-xs rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 border border-neutral-200 dark:border-neutral-700 focus:border-neutral-400 dark:focus:border-neutral-600 focus:outline-none transition-colors"
          />
          <kbd className="absolute right-2 text-[10px] font-mono text-neutral-400 bg-neutral-200/60 dark:bg-neutral-700/60 px-1 py-0.5 rounded">
            ⌘K
          </kbd>
        </div>

        {/* Engine status indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-medium">Ready</span>
        </div>

        {/* Notifications */}
        <button
          className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          aria-label="Notifications"
        >
          <BellIcon size={16} />
        </button>

        {/* Start Conversation Button */}
        <Button
          variant="primary"
          size="sm"
          onClick={onStartConversation}
          leftIcon={<SparklesIcon size={13} />}
        >
          <span>Start Conversation</span>
        </Button>
      </div>
    </header>
  );
}
