'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { UploadSection } from '@/components/dashboard/UploadSection';
import { ProcessingStatusCard } from '@/components/dashboard/ProcessingStatusCard';
import { RecentDocuments } from '@/components/dashboard/RecentDocuments';
import { ConversationModal } from '@/components/dashboard/ConversationModal';
import { DocumentViewerModal } from '@/components/dashboard/DocumentViewerModal';
import { ResearchView } from '@/components/dashboard/ResearchView';
import { ComparisonView } from '@/components/dashboard/ComparisonView';
import { AgentMonitorView } from '@/components/dashboard/AgentMonitorView';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  SparklesIcon,
  MessagesSquareIcon,
  SettingsIcon,
} from '@/components/ui/Icons';
import { DocumentItem, NavigationTab, ProcessingJob } from '@/types';
import { api } from '@/services/api';

const initialDocuments: DocumentItem[] = [
  {
    id: 'doc-1',
    name: 'annual_financial_report_2025.pdf',
    size: '4.2 MB',
    sizeBytes: 4404019,
    type: 'pdf',
    uploadedAt: '12 mins ago',
    status: 'ready',
    chunksCount: 142,
    vectorCount: 142,
    tokensProcessed: 98400,
  },
  {
    id: 'doc-2',
    name: 'master_service_agreement_v3.docx',
    size: '1.8 MB',
    sizeBytes: 1887436,
    type: 'docx',
    uploadedAt: '45 mins ago',
    status: 'ready',
    chunksCount: 86,
    vectorCount: 86,
    tokensProcessed: 54200,
  },
  {
    id: 'doc-3',
    name: 'regulatory_compliance_guidelines.pdf',
    size: '5.6 MB',
    sizeBytes: 5872025,
    type: 'pdf',
    uploadedAt: '2 mins ago',
    status: 'processing',
    progress: 48,
    currentStage: 'chunking',
    chunksCount: 112,
    vectorCount: 54,
  },
  {
    id: 'doc-4',
    name: 'customer_feedback_transcripts.csv',
    size: '840 KB',
    sizeBytes: 860160,
    type: 'csv',
    uploadedAt: '2 hours ago',
    status: 'ready',
    chunksCount: 64,
    vectorCount: 64,
    tokensProcessed: 32100,
  },
  {
    id: 'doc-5',
    name: 'product_strategy_roadmap_2026.pdf',
    size: '3.1 MB',
    sizeBytes: 3250585,
    type: 'pdf',
    uploadedAt: '4 hours ago',
    status: 'ready',
    chunksCount: 95,
    vectorCount: 95,
    tokensProcessed: 68900,
  },
  {
    id: 'doc-6',
    name: 'cloud_security_audit_matrix.xlsx',
    size: '920 KB',
    sizeBytes: 942080,
    type: 'xlsx',
    uploadedAt: 'Just now',
    status: 'queued',
    progress: 0,
    currentStage: 'uploading',
  },
];

const initialJobs: ProcessingJob[] = [
  {
    id: 'job-101',
    documentId: 'doc-3',
    documentName: 'regulatory_compliance_guidelines.pdf',
    stage: 'chunking',
    progress: 48,
    currentStepDescription: 'Semantic chunking (512 tokens) pages 14-22...',
    startedAt: '12:41 PM',
    estimatedRemainingSec: 18,
  },
  {
    id: 'job-102',
    documentId: 'doc-6',
    documentName: 'cloud_security_audit_matrix.xlsx',
    stage: 'parsing',
    progress: 15,
    currentStepDescription: 'Parsing tabular ranges and cell structure...',
    startedAt: '12:43 PM',
    estimatedRemainingSec: 32,
  },
];

export default function Home() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [activeJobs, setActiveJobs] = useState<ProcessingJob[]>(initialJobs);
  const [searchQuery, setSearchQuery] = useState('');
  const [isConversationModalOpen, setIsConversationModalOpen] = useState(false);
  const [selectedDocForChat, setSelectedDocForChat] = useState<DocumentItem | null>(null);
  const [viewerModalState, setViewerModalState] = useState<{
    isOpen: boolean;
    documentId: string | null;
    documentName?: string;
    initialPage: number;
    highlightText?: string;
  }>({
    isOpen: false,
    documentId: null,
    documentName: undefined,
    initialPage: 1,
    highlightText: undefined,
  });

  const handleOpenViewer = (docId: string, page: number = 1, text?: string) => {
    const doc = documents.find((d) => d.id === docId);
    setViewerModalState({
      isOpen: true,
      documentId: docId,
      documentName: doc?.name || 'Document',
      initialPage: page,
      highlightText: text,
    });
  };

  // Sync with live backend if available
  useEffect(() => {
    async function fetchBackendDocs() {
      const liveDocs = await api.listDocuments();
      if (liveDocs.length > 0) {
        setDocuments(liveDocs);
      }
    }
    fetchBackendDocs();
  }, []);

  // Document upload handler
  const handleDocumentUploaded = (newDoc: DocumentItem) => {
    setDocuments((prev) => [newDoc, ...prev]);

    const newJob: ProcessingJob = {
      id: `job-${Date.now()}`,
      documentId: newDoc.id,
      documentName: newDoc.name,
      stage: 'parsing',
      progress: 25,
      currentStepDescription: 'Analyzing document structure and optical layout...',
      startedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      estimatedRemainingSec: 25,
    };
    setActiveJobs((prev) => [newJob, ...prev]);

    setTimeout(() => {
      setActiveJobs((prev) =>
        prev.map((j) =>
          j.id === newJob.id
            ? { ...j, stage: 'embedding', progress: 75, currentStepDescription: 'Generating 384-dim vector embeddings...' }
            : j
        )
      );
      setDocuments((prev) =>
        prev.map((d) => (d.id === newDoc.id ? { ...d, progress: 75, currentStage: 'embedding' } : d))
      );
    }, 2500);

    setTimeout(() => {
      setActiveJobs((prev) => prev.filter((j) => j.id !== newJob.id));
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === newDoc.id
            ? {
                ...d,
                status: 'ready',
                progress: 100,
                currentStage: 'completed',
                chunksCount: Math.floor(Math.random() * 60) + 30,
              }
            : d
        )
      );
    }, 5000);
  };

  const handleDeleteDoc = async (docId: string) => {
    try {
      await api.deleteDocument(docId);
    } catch {
      // Ignore if offline
    }
    setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
    setActiveJobs((prev) => prev.filter((job) => job.documentId !== docId));
  };

  const handleStartChatWithDoc = (doc: DocumentItem) => {
    setSelectedDocForChat(doc);
    setIsConversationModalOpen(true);
  };

  const handleStartGeneralConversation = () => {
    setSelectedDocForChat(null);
    setIsConversationModalOpen(true);
  };

  return (
    <AppLayout
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      onStartConversation={handleStartGeneralConversation}
      documentCount={documents.length}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    >
      {/* Tab: Dashboard Overview */}
      {currentTab === 'dashboard' && (
        <>
          {/* Simple Clean Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-5 border-b border-neutral-200 dark:border-neutral-800 gap-3">
            <div>
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Workspace Overview
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Manage document ingestion, processing status, and verified agent conversations.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleStartGeneralConversation}
                leftIcon={<SparklesIcon size={13} />}
              >
                Start Conversation
              </Button>
            </div>
          </div>

          {/* Clean Metric Cards */}
          <StatsOverview documents={documents} />

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column: Upload Section & Recent Documents */}
            <div className="lg:col-span-7 space-y-5">
              <UploadSection onDocumentUploaded={handleDocumentUploaded} />
              <RecentDocuments
                documents={documents}
                onStartChatWithDoc={handleStartChatWithDoc}
                onDeleteDoc={handleDeleteDoc}
                onOpenViewer={handleOpenViewer}
              />
            </div>

            {/* Right Column: Processing Pipeline Status & Agent Starters */}
            <div className="lg:col-span-5 space-y-5">
              <ProcessingStatusCard activeJobs={activeJobs} />

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Conversation Agents</CardTitle>
                  <CardDescription>
                    Contextual agents grounded on verified workspace documents.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 rounded-lg border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850">
                    <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                      Document Synthesis
                    </div>
                    <p className="text-[11px] text-neutral-500 mb-3">
                      Ask complex questions across documents with verified citations.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStartGeneralConversation}
                      className="w-full text-xs"
                    >
                      Start Session
                    </Button>
                  </div>

                  <div className="p-3 rounded-lg border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850">
                    <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                      Data &amp; Table Extraction
                    </div>
                    <p className="text-[11px] text-neutral-500 mb-3">
                      Extract structured tables, numbers, and balance sheets into JSON.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStartGeneralConversation}
                      className="w-full text-xs"
                    >
                      Query Tables
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Tab: Documents */}
      {currentTab === 'documents' && (
        <div className="space-y-5">
          <UploadSection onDocumentUploaded={handleDocumentUploaded} />
          <RecentDocuments
            documents={documents}
            onStartChatWithDoc={handleStartChatWithDoc}
            onDeleteDoc={handleDeleteDoc}
            onOpenViewer={handleOpenViewer}
          />
        </div>
      )}

      {/* Tab: Research Studio */}
      {currentTab === 'research' && (
        <ResearchView documents={documents} onOpenViewer={handleOpenViewer} />
      )}

      {/* Tab: Document Compare */}
      {currentTab === 'compare' && (
        <ComparisonView documents={documents} onOpenViewer={handleOpenViewer} />
      )}

      {/* Tab: Conversations */}
      {currentTab === 'conversations' && (
        <div className="space-y-5">
          <Card className="text-center p-8 sm:p-12">
            <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center mx-auto mb-3">
              <MessagesSquareIcon size={20} />
            </div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Conversational Agents
            </h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              Initiate deep reasoning chats with citation-backed responses across all indexed documents.
            </p>
            <div className="mt-4 flex justify-center">
              <Button
                variant="primary"
                size="sm"
                onClick={handleStartGeneralConversation}
                leftIcon={<SparklesIcon size={14} />}
              >
                New Conversation
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Tab: Pipelines & Agent Monitor */}
      {currentTab === 'pipelines' && (
        <AgentMonitorView activeJobs={activeJobs} />
      )}

      {/* Tab: Analytics */}
      {currentTab === 'analytics' && (
        <div className="space-y-5">
          <StatsOverview documents={documents} />
          <Card className="p-6 text-center">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Retrieval &amp; Indexing Analytics
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Embedding density, chunk distributions, and retrieval latency metrics.
            </p>
          </Card>
        </div>
      )}

      {/* Tab: Settings */}
      {currentTab === 'settings' && (
        <div className="space-y-5 max-w-xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon size={16} /> Configuration
              </CardTitle>
              <CardDescription>
                Model, vector store, and chunking parameters.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              <div>
                <label className="font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                  LLM Provider &amp; Model
                </label>
                <input
                  type="text"
                  readOnly
                  value="Groq AI / llama-3.3-70b-versatile"
                  className="w-full p-2 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                  Embedding Model
                </label>
                <input
                  type="text"
                  readOnly
                  value="sentence-transformers/all-MiniLM-L6-v2 (384 dim)"
                  className="w-full p-2 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                  Retrieval Strategy
                </label>
                <input
                  type="text"
                  readOnly
                  value="Hybrid (pgvector + BM25) + RRF (k=60) + Cross-Encoder"
                  className="w-full p-2 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono text-[11px]"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Conversation Modal */}
      <ConversationModal
        isOpen={isConversationModalOpen}
        onClose={() => setIsConversationModalOpen(false)}
        documents={documents}
        selectedDocument={selectedDocForChat}
        onOpenViewer={handleOpenViewer}
      />

      {/* Document Viewer Modal with Page-by-Page and Citations */}
      <DocumentViewerModal
        isOpen={viewerModalState.isOpen}
        onClose={() => setViewerModalState((prev) => ({ ...prev, isOpen: false }))}
        documentId={viewerModalState.documentId}
        documentName={viewerModalState.documentName}
        initialPage={viewerModalState.initialPage}
        highlightText={viewerModalState.highlightText}
      />
    </AppLayout>
  );
}
