"""
Multi-Agent AI System
Coordinates specialized AI agents for different debate aspects
"""

import React, { useState, useEffect, useCallback } from 'react';
import { Users, Brain, MessageSquare, TrendingUp, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Agent {
  id: string;
  name: string;
  specialty: 'logic' | 'evidence' | 'strategy' | 'rhetoric' | 'emotional';
  role: string;
  isActive: boolean;
  expertise: number;
  responseTime: number;
  conversationHistory: { role: 'user' | 'assistant'; content: string; timestamp: number }[];
}

interface AgentResponse {
  agentId: string;
  content: string;
  confidence: number;
  evidenceLevel: number;
  persuasiveScore: number;
  specialty: string;
  processingTime: number;
}

export function MultiAgentSystem() {
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: 'logic-master',
      name: 'Logic Master',
      specialty: 'logic',
      role: 'Detects logical fallacies and ensures argument validity',
      isActive: true,
      expertise: 95,
      responseTime: 0,
      conversationHistory: [],
    },
    {
      id: 'evidence-hunter',
      name: 'Evidence Hunter',
      specialty: 'evidence',
      role: 'Finds and verifies sources, statistics, and facts',
      isActive: true,
      expertise: 88,
      responseTime: 0,
      conversationHistory: [],
    },
    {
      id: 'strategy-consultant',
      name: 'Strategy Consultant',
      specialty: 'strategy',
      role: 'Plans debate approach, finds angles and counterarguments',
      isActive: true,
      expertise: 82,
      responseTime: 0,
      conversationHistory: [],
    },
    {
      id: 'rhetoric-expert',
      name: 'Rhetoric Expert',
      specialty: 'rhetoric',
      role: 'Improves persuasion, style, and communication effectiveness',
      isActive: true,
      expertise: 79,
      responseTime: 0,
      conversationHistory: [],
    },
    {
      id: 'emotion-analyzer',
      name: 'Emotion Analyzer',
      specialty: 'emotional',
      role: 'Detects user emotions and adapts responses accordingly',
      isActive: true,
      expertise: 75,
      responseTime: 0,
      conversationHistory: [],
    },
  ]);
  
  const [agentResponses, setAgentResponses] = useState<AgentResponse[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeDebate, setActiveDebate] = useState({ topic: '', round: 0, participants: [] });

  const coordinateDebate = useCallback(async (userArgument: string, debateContext: any) => {
    setIsProcessing(true);
    setAgentResponses([]);

    try {
      // Simulate parallel agent processing
      const processingPromises = agents
        .filter(a => a.isActive)
        .map(async (agent) => {
          const startTime = Date.now();
          const prompt = `
            Role: ${agent.role}
            Topic: ${debateContext.topic}
            Round: ${debateContext.round}
            Context: ${debateContext.context}
            User Argument: ${userArgument}
            
            Analyze this and provide:
            1. Critical analysis (strengths/weaknesses)
            2. Suggestions for improvement
            3. Evidence verification
            4. Recommended counterpoints
            
            Keep response concise and actionable.
          `;

          // Simulate AI processing time
          await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

          const mockResponses = {
            'logic-master': {
              content: '• Logical structure: Strong - clear cause-effect relationship established. Gap: premises need better qualification. Consider: "While X may or may not directly cause Y..."',
              confidence: 92,
              evidenceLevel: 85,
              persuasiveScore: 78,
            },
            'evidence-hunter': {
              content: '• Supporting evidence: Recent study (Smith et al., 2024) shows correlation. Limitation: sample size small. Consider additional data points.',
              confidence: 88,
              evidenceLevel: 95,
              persuasiveScore: 82,
            },
            'strategy-consultant': {
              content: '• Strategic angle: Appeal to economic benefits vs. traditional costs. Counter: anticipate "slippery slope" objections early.',
              confidence: 85,
              evidenceLevel: 75,
              persuasiveScore: 90,
            },
            'rhetoric-expert': {
              content: '• Rhetoric: Use "we" language and specific examples. Replace "bad" with "problematic" for academic tone. Include powerful statistics.',
              confidence: 80,
              evidenceLevel: 70,
              persuasiveScore: 88,
            },
            'emotion-analyzer': {
              content: '• Audience connection: Acknowledge potential concerns about job loss early. Frame benefits in terms of community resilience.',
              confidence: 78,
              evidenceLevel: 65,
              persuasiveScore: 85,
            },
          };

          const response = mockResponses[agent.id as keyof typeof mockResponses] || {
            content: 'Analysis completed by ' + agent.name + '.',
            confidence: 70,
            evidenceLevel: 70,
            persuasiveScore: 70,
          };

          return {
            agentId: agent.id,
            content: response.content,
            confidence: response.confidence,
            evidenceLevel: response.evidenceLevel,
            persuasiveScore: response.persuasiveScore,
            specialty: agent.specialty,
            processingTime: Date.now() - startTime,
          };
        });

      const results = await Promise.all(processingPromises);
      setAgentResponses(results);

    } catch (error) {
      console.error('Agent coordination error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [agents]);

  const toggleAgent = (agentId: string) => {
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, isActive: !a.isActive } : a));
  };

  return (
    <div className="space-y-4">
      {/* Agent Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className={cn(
              "p-3 rounded-lg border cursor-pointer transition-all",
              agent.isActive
                ? "bg-blue-50 border-blue-300"
                : "bg-gray-50 border-gray-200 opacity-60"
            )
            }
            onClick={() => toggleAgent(agent.id)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Brain size={14} className={agent.isActive ? "text-blue-600" : "text-gray-400"} />
                <span className="text-xs font-medium" style={{ color: agent.isActive ? '#1565C0' : '#9A9A9A' }}>{agent.name}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white" style={{ color: '#E8852E', border: '1px solid #E8852E' }}>{agent.expertise}%</span>
            </div>
            <p className="text-xs" style={{ color: '#6B6B6B' }}>{agent.role}</p>
            <div className="mt-2 flex justify-between text-[10px]" style={{ color: '#9A9A9A' }}>
              <span>Response: {agent.responseTime}ms</span>
              <span>Specialty: {agent.specialty}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Agent Input */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold" style={{ color: '#2D2D2D' }}>Coordinate Debate Analysis</h3>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Enter your argument or question...".
            className="w-full px-3 py-2 rounded-lg text-xs lg-subtle"
          />
          <input
            type="text"
            placeholder=" Debate context (e.g., 'The topic is about renewable energy...')"
            className="w-full px-3 py-2 rounded-lg text-xs lg-subtle"
          />
          <select className="w-full px-3 py-2 rounded-lg text-xs lg-subtle">
            <option>Round 1 - Opening Statement</option>
            <option>Round 2 - Rebuttal</option>
            <option>Round 3 - Closing</option>
          </select>
        </div>

        <button
          onClick={() => coordinateDebate('example argument', { topic: 'renewable energy', round: 1, context: 'The benefits of solar power' })}
          disabled={isProcessing}
          className="w-full px-4 py-2 rounded-lg font-medium transition-all hover:scale-[1.02] disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #E8852E, #D4853A)', color: '#fff' }}
        >
          <Zap size={14} className="inline mr-2" />
          {isProcessing ? 'Analyzing...' : 'Run Agent Coordination'}
        </button>
      </div>

      {/* Agent Response Dashboard */}
      {agentResponses.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold" style={{ color: '#2D2D2D' }}>Agent Analysis Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {agentResponses.map((response, idx) => {
              const agent = agents.find(a => a.id === response.agentId);
              if (!agent) return null;

              return (
                <motion.div
                  key={response.agentId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="rounded-lg p-4 backdrop-blur-xl"
                  style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.08)' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Brain size={14} style={{ color: '#E8852E' }} />
                      <span className="text-xs font-bold" style={{ color: '#2D2D2D' }}>{agent.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                        Conf: {response.confidence}%
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                        Pers: {response.persuasiveScore}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs" style={{ color: '#6B6B6B' }}>{response.content}</p>
                  <div className="mt-2 flex justify-between text-[10px]" style={{ color: '#9A9A9A' }}>
                    <span>Specialty: {response.specialty}</span>
                    <span>Processed: {response.processingTime}ms</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}