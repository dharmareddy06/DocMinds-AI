import { useState, useCallback } from 'react';
import { api } from '@/services/api';

export function useResearch() {
  const [isResearching, setIsResearching] = useState<boolean>(false);
  const [findings, setFindings] = useState<string | null>(null);
  const [citations, setCitations] = useState<any[]>([]);
  const [executionTrace, setExecutionTrace] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const executeResearch = useCallback(async (query: string) => {
    if (!query.trim() || isResearching) return;
    try {
      setIsResearching(true);
      setError(null);
      const res = await api.startResearch(query);
      setFindings(res.findings);
      setCitations(res.citations || []);
      setExecutionTrace(res.execution_trace || []);
    } catch (err: any) {
      setError(err.message || 'Research investigation failed');
    } finally {
      setIsResearching(false);
    }
  }, [isResearching]);

  return {
    isResearching,
    findings,
    citations,
    executionTrace,
    error,
    executeResearch,
  };
}
