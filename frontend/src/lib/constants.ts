export const APP_CONFIG = {
  name: 'DocMind AI',
  description: 'Enterprise Document Intelligence & Agentic RAG Platform',
  version: '2.4.0',
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  groqModel: 'openai/gpt-oss-120b',
  maxUploadSizeBytes: 50 * 1024 * 1024,
  allowedFileTypes: ['.pdf', '.docx', '.txt', '.csv', '.xlsx', '.md'],
};

export const NAVIGATION_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { id: 'documents', label: 'Documents', href: '/documents' },
  { id: 'chat', label: 'AI Chat', href: '/chat' },
  { id: 'research', label: 'Research Studio', href: '/research' },
  { id: 'compare', label: 'Comparison Matrix', href: '/compare' },
  { id: 'monitor', label: 'Agent Monitor', href: '/monitor' },
  { id: 'settings', label: 'Settings', href: '/settings' },
];

export const THEME_COLORS = {
  background: '#09090b',
  surface: '#18181b',
  surfaceElevated: '#27272a',
  limeAccent: '#a3e635',
  limeAccentHover: '#bef264',
  textPrimary: '#ffffff',
  textSecondary: '#a1a1aa',
  border: '#27272a',
};
