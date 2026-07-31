"""
Real-Time Knowledge Integration System
Manages live data retrieval, fact-checking, and source verification
"""

import React, { useState, useEffect, useCallback } from 'react';
import { Wifi, Database, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KnowledgeSource {
  id: string;
  name: string;
  baseUrl: string;
  apiKey?: string;
  isActive: boolean;
  lastSync: Date;
  errorCount: number;
}

interface FactCheckResult {
  claim: string;
  isVerified: boolean;
  confidence: number;
  sources: { name: string; url: string; credibility: number }[];
  timestamp: Date;
}

interface LiveKnowledge {
  topic: string;
  facts: { text: string; verified: boolean; credibility: number }[];
  sources: string[];
  lastUpdated: Date;
}

export function KnowledgeIntegration() {
  const [sources, setSources] = useState<KnowledgeSource[]>([
    { id: 'news', name: 'News API', baseUrl: 'https://newsapi.org', isActive: true, lastSync: new Date(), errorCount: 0 },
    { id: 'research', name: 'Research Database', baseUrl: 'https://api.crossref.org', isActive: true, lastSync: new Date(), errorCount: 0 },
    { id: 'government', name: 'Open Data', baseUrl: 'https://api.gov.uk', isActive: true, lastSync: new Date(), errorCount: 0 },
    { id: 'academic', name: 'Academic Sources', baseUrl: 'https://api.semanticscholar.org', isActive: true, lastSync: new Date(), errorCount: 0 },
  ]);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [liveKnowledge, setLiveKnowledge] = useState<LiveKnowledge | null>(null);
  const [factCheck, setFactCheck] = useState<FactCheckResult | null>(null);

  const syncKnowledge = useCallback(async (topic: string) => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/knowledge/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, sources: sources.filter(s => s.isActive) })
      });
      const data = await response.json();
      setLiveKnowledge(data.knowledge);
      setSources(prev => prev.map(s => ({ ...s, lastSync: new Date(), errorCount: 0 })));
    } catch (error) {
      console.error('Knowledge sync error:', error);
      setSources(prev => prev.map(s => ({ ...s, errorCount: s.errorCount + 1 })));
    } finally {
      setIsSyncing(false);
    }
  }, [sources]);

  const checkFact = useCallback(async (claim: string) => {
    try {
      const response = await fetch('/api/fact-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim, sources: sources.filter(s => s.isActive) })
      });
      const data = await response.json();
      setFactCheck(data);
    } catch (error) {
      console.error('Fact check error:', error);
    }
  }, [sources]);

  return (
    <div className="space-y-4">
      {/* Status Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {sources.map((source) => (
          <div key={source.id} className={cn(
            "p-3 rounded-lg border transition-all",
            source.isActive ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
          )}
          style={source.isActive ? { boxShadow: '0 2px 8px rgba(76,175,80,0.2)' } : {}}
          >
            <div className="flex items-center gap-2 mb-1">
              <Database size={14} className={source.isActive ? "text-green-600" : "text-red-600"} />
              <span className="text-xs font-medium" style={{ color: source.isActive ? '#2E7D32' : '#C62828' }}>{source.name}</span>
              {source.errorCount > 0 && (
                <AlertTriangle size={12} className="text-orange-500" />
              )}
            </div>
            <p className="text-[10px]" style={{ color: '#6B6B6B' }}>
              Last sync: {source.lastSync.toLocaleTimeString()}
            </p>
            {source.errorCount > 0 && (
              <p className="text-[10px] text-orange-600">
                {source.errorCount} errors
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Sync Controls */}
      <div className="flex gap-2">
        <button
          onClick={() => syncKnowledge('current-topic')}
          disabled={isSyncing}
          className="px-4 py-2 rounded-lg font-medium transition-all hover:scale-[1.02] disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #FF9F4C, #E8852E)', color: '#fff' }}
        >
          <Wifi size={14} className="inline mr-2" />
          {isSyncing ? 'Syncing...' : 'Sync Knowledge'}
        </button>
        <button
          onClick={() => setSources(prev => prev.map(s => ({ ...s, isActive: !s.isActive }))}
          className="px-4 py-2 rounded-lg font-medium transition-all hover:scale-[1.02] lg-button"
        >Toggle Sources
        </button>
      </div>

      {/* Live Knowledge Display */}
      {liveKnowledge && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="rounded-xl p-4 backdrop-blur-xl"
          style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.08)' }}
        >
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: '#2D2D2D' }}>
            <TrendingUp size={14} style={{ color: '#E8852E' }} />
            Live Knowledge: {liveKnowledge.topic}
          </h3>
          <div className="space-y-2">
            {liveKnowledge.facts.map((fact, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <CheckCircle size={12} className={fact.verified ? 'text-green-500' : 'text-gray-400'} />
                <p className="text-xs" style={{ color: fact.verified ? '#2E7D32' : '#9A9A9A' }}>{fact.text}</p>
                <span className="text-[10px] font-mono" style={{ color: '#9A9A9A' }}> credibility: {fact.credibility}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Fact Check */}
      <div className="space-y-2">
        <h3 className="font-bold text-sm" style={{ color: '#2D2D2D' }}>Fact Verification</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter claim to verify..."
            className="flex-1 px-3 py-2 rounded-lg text-xs lg-subtle"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                checkFact(e.currentTarget.value.trim());
              }
            }}
          />
          <button
            onClick={() => {
              const input = document.querySelector('input') as HTMLInputElement;
              if (input?.value.trim()) checkFact(input.value.trim());
            }}
            className="px-3 py-2 rounded-lg font-medium transition-all hover:scale-[1.02] lg-button"
          >
            Verify
          </button>
        </div>

        {factCheck && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="rounded-lg p-3 backdrop-blur-xl mt-2"
            style={{ background: factCheck.isVerified ? 'rgba(76,175,80,0.08)' : 'rgba(244,67,54,0.08)',
              border: `1px solid ${factCheck.isVerified ? 'rgba(76,175,80,0.2)' : 'rgba(244,67,54,0.2)'}`
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              {factCheck.isVerified ? (
                <CheckCircle size={14} className="text-green-600" />
              ) : (
                <AlertTriangle size={14} className="text-red-600" />
              )}
              <span className="text-xs font-medium" style={{ color: factCheck.isVerified ? '#2E7D32' : '#C62828' }}>
                {factCheck.isVerified ? 'Verified' : 'Disputed'}
              </span>
              <span className="text-[10px]" style={{ color: '#9A9A9A' }}>Confidence: {factCheck.confidence}%</span>
            </div>
            <p className="text-xs mb-2" style={{ color: '#6B6B6B' }}>"{factCheck.claim}"</p>
            <div className="space-y-1">
              <p className="text-[10px] font-medium" style={{ color: '#9A9A9A' }}>Sources:</p>
              {factCheck.sources.map((source, idx) => (
                <a
                  key={idx}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-[10px] hover:underline"
                  style={{ color: source.credibility > 0.7 ? '#E8852E' : '#6B6B6B' }}
                >
                  • {source.name} (credibility: {source.credibility})
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}