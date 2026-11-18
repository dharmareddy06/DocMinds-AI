'use client';

import React from 'react';
import { NavigationTab } from '@/types';
import {
  LayoutDashboardIcon,
  FileTextIcon,
  MessagesSquareIcon,
  CpuIcon,
  BarChart3Icon,
  SettingsIcon,
  XIcon,
} from '@/components/ui/Icons';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isOpen: boolean;
  onClose: () => void;
  documentCount?: number;
}

const navItems: {
  id: NavigationTab;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
}[] = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboardIcon },
  { id: 'documents', label: 'Documents', icon: FileTextIcon, badge: '12' },
  { id: 'conversations', label: 'Conversations', icon: MessagesSquareIcon },
  { id: 'pipelines', label: 'Pipelines', icon: CpuIcon, badge: '2' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3Icon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export function Sidebar({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
  documentCount = 12,
}: SidebarProps) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-neutral-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-60 flex flex-col bg-neutral-50 dark:bg-neutral-925 border-r border-neutral-200 dark:border-neutral-800 transition-transform duration-150 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold text-xs tracking-wider shadow-2xs">
              DM
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm tracking-tight leading-tight">
                DocMind AI
              </span>
              <span className="text-[10px] text-neutral-400 font-normal">
                Enterprise Studio
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Close sidebar"
          >
            <XIcon size={16} />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-2.5 py-4 space-y-0.5 overflow-y-auto">
          <div className="px-2.5 pb-2 text-[10px] font-medium uppercase tracking-wider text-neutral-400">
            Platform
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            const dynamicBadge = item.id === 'documents' ? documentCount.toString() : item.badge;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-neutral-200/70 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    size={16}
                    className={isActive ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-400'}
                  />
                  <span>{item.label}</span>
                </div>
                {dynamicBadge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      isActive
                        ? 'bg-neutral-300/80 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200'
                        : 'bg-neutral-200/60 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    {dynamicBadge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Storage / System Usage Widget */}
        <div className="px-3 py-3 mx-2.5 mb-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">Index Quota</span>
            <span className="text-[10px] font-mono text-neutral-400">3.4 / 10 GB</span>
          </div>
          <ProgressBar value={34} size="sm" color="neutral" />
        </div>

        {/* User Profile Footer */}
        <div className="p-2.5 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-neutral-700 dark:text-neutral-300 text-xs font-medium">
              SC
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100 truncate">
                Sarah Chen
              </span>
              <span className="text-[10px] text-neutral-400 truncate">
                DocMind Workspace
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
