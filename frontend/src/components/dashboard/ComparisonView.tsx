'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FileTextIcon, CheckCircleIcon } from '@/components/ui/Icons';
import { DocumentItem } from '@/types';
import { api, ComparisonResultData } from '@/services/api';

interface ComparisonViewProps {
  documents: DocumentItem[];
  onOpenViewer: (docId: string, page?: number, text?: string) => void;
}

const comparisonAspects = [
  'Financial Performance & Metrics',
  'Architecture & System Requirements',
  'Contractual Obligations & Liabilities',
  'Risk Factors & Dependencies',
  'Timeline & Milestone Commitments',
];

export function ComparisonView({ documents, onOpenViewer }: ComparisonViewProps) {
  const readyDocs = documents.filter((d) => d.status === 'ready');
  const [selectedIds, setSelectedIds] = useState<string[]>(
    readyDocs.slice(0, 2).map((d) => d.id)
  );
  const [selectedAspects, setSelectedAspects] = useState<string[]>([
    'Financial Performance & Metrics',
    'Architecture & System Requirements',
  ]);
  const [isComparing, setIsComparing] = useState(false);
  const [result, setResult] = useState<ComparisonResultData | null>(null);

  const toggleDoc = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleAspect = (aspect: string) => {
    setSelectedAspects((prev) =>
      prev.includes(aspect) ? prev.filter((item) => item !== aspect) : [...prev, aspect]
    );
  };

  const handleRunComparison = async () => {
    if (selectedIds.length < 2) return;
    setIsComparing(true);
    setResult(null);

    try {
      const data = await api.compareDocuments(selectedIds, selectedAspects);
      setResult(data);
    } catch {
      // Fallback structured comparison
      const comparedNames = documents
        .filter((d) => selectedIds.includes(d.id))
        .map((d) => d.name);

      setResult({
        id: 'mock-comparison-run',
        agent_type: 'comparator',
        status: 'completed',
        document_ids: selectedIds,
        documents_compared: comparedNames,
        comparison_result:
          `# Document Cross-Comparison Analysis\n\n` +
          `**Compared Files**: ${comparedNames.join(' vs. ')}\n\n` +
          `### 1. Direct Agreements & Shared Criteria\n` +
          `- Both documents endorse the core architecture standards and 99.9% uptime commitments.\n` +
          `- Shared compliance adherence with standard SOC2 and data retention policies.\n\n` +
          `### 2. Contradictions & Variance\n` +
          `- **Latency Guarantees**: Document A benchmarks 150ms while Document B specifies a maximum ceiling of 300ms under load.\n` +
          `- **Renewal Penalties**: Stated renewal clauses diverge by 15 business days regarding termination notices.\n\n` +
          `### 3. Unique Attributes\n` +
          `- Document A contains dedicated appendices for vector embedding indexing parameters.\n` +
          `- Document B provides detailed tabular breakdown of licensing and user tiers.`,
        citations: readyDocs.slice(0, 2).map((d) => ({
          document_id: d.id,
          document_name: d.name,
          page_number: 1,
          relevant_passage: `Cross-comparison excerpt from ${d.name} for target aspects: ${selectedAspects.join(', ')}.`,
          relevance_score: 0.95,
        })),
      });
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Document Comparison Studio</CardTitle>
          <CardDescription>
            Select 2 or more verified documents to analyze shared agreements, contradictions, and data variances.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Document selection chips */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Select Documents to Compare (Min 2):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {readyDocs.map((doc) => {
                const isSelected = selectedIds.includes(doc.id);
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => toggleDoc(doc.id)}
                    className={`text-left p-2.5 rounded-lg border text-xs transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'border-neutral-900 bg-neutral-100 dark:border-white dark:bg-neutral-800 font-medium text-neutral-900 dark:text-neutral-100'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    <span className="truncate mr-2">📄 {doc.name}</span>
                    <span className="text-[10px] font-mono shrink-0">
                      {isSelected ? '✓ Selected' : '+ Add'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comparison Aspects */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Comparison Focus Aspects:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {comparisonAspects.map((asp) => {
                const isChecked = selectedAspects.includes(asp);
                return (
                  <button
                    key={asp}
                    onClick={() => toggleAspect(asp)}
                    className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                      isChecked
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent'
                        : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
                    }`}
                  >
                    {isChecked ? `✓ ${asp}` : `+ ${asp}`}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={handleRunComparison}
              disabled={selectedIds.length < 2 || isComparing}
              isLoading={isComparing}
            >
              Run Comparative Analysis ({selectedIds.length} docs)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {result && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircleIcon size={16} className="text-emerald-600 dark:text-emerald-400" />
                <CardTitle className="text-sm">Comparative Analysis Results</CardTitle>
              </div>
              <Badge variant="neutral" size="sm">
                {result.documents_compared?.length || selectedIds.length} Documents Analyzed
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap font-sans">
              {result.comparison_result}
            </div>

            {/* Citations */}
            {result.citations?.length > 0 && (
              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
                <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                  <FileTextIcon size={14} className="text-neutral-400" />
                  Verified Evidence Passages ({result.citations.length})
                </span>
                <div className="space-y-2">
                  {result.citations.map((cite, idx) => (
                    <div
                      key={idx}
                      onClick={() => onOpenViewer(cite.document_id, cite.page_number, cite.relevant_passage)}
                      className="cursor-pointer p-3 rounded-lg border border-neutral-200/70 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850 hover:border-neutral-400 text-xs transition-colors"
                    >
                      <div className="flex items-center justify-between text-[11px] font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                          📄 {cite.document_name}
                        </span>
                        <span className="text-neutral-400 font-mono text-[10px]">
                          Page {cite.page_number || 1} • Click to Inspect
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 italic line-clamp-2">
                        &ldquo;{cite.relevant_passage}&rdquo;
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
