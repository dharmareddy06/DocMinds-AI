export type DocumentStatus = 'ready' | 'processing' | 'queued' | 'failed';

export type FileExtension = 'pdf' | 'docx' | 'txt' | 'csv' | 'md' | 'xlsx' | 'json';

export type ProcessingStage = 
  | 'uploading'
  | 'parsing'
  | 'chunking'
  | 'embedding'
  | 'indexing'
  | 'completed'
  | 'failed';

export interface DocumentItem {
  id: string;
  name: string;
  size: string;
  sizeBytes: number;
  type: FileExtension;
  uploadedAt: string;
  status: DocumentStatus;
  progress?: number;
  currentStage?: ProcessingStage;
  chunksCount?: number;
  vectorCount?: number;
  tokensProcessed?: number;
}

export interface ProcessingJob {
  id: string;
  documentId: string;
  documentName: string;
  stage: ProcessingStage;
  progress: number;
  currentStepDescription: string;
  startedAt: string;
  estimatedRemainingSec?: number;
}

export type NavigationTab = 
  | 'dashboard'
  | 'documents'
  | 'conversations'
  | 'research'
  | 'compare'
  | 'pipelines'
  | 'analytics'
  | 'settings';

export interface NavItemConfig {
  id: NavigationTab;
  label: string;
  badge?: string | number;
  badgeVariant?: 'neutral' | 'success' | 'warning' | 'primary';
}

export interface StatMetric {
  id: string;
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
  description: string;
}

export interface ConversationStarter {
  id: string;
  title: string;
  prompt: string;
  suggestedDocId?: string;
}
