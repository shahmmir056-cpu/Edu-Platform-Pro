"""
Advanced Real-Time Analytics for Debate Performance
"""

import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Target, Users, Clock, Brain, BarChart3, Activity, AlertTriangle } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface PerformanceMetric {
  timestamp: number;
  argumentQuality: number;
  persuasionScore: number;
  logicScore: number;
  evidenceScore: number;
  engagementScore: number;
  responseTime: number;
}

interface AdvancedAnalytics {
  // Performance tracking
  performanceHistory: PerformanceMetric[];
  currentStreak: number;
  bestStreak: number;
  overallTrend: 'improving' | 'stable' | 'declining';

  // Skill analysis
  skillVelocity: { [key: string]: number };
  weakAreas: string[];
  strongAreas: string[];
  learningRate: number;

  // Comparative analysis
  peerComparison: {
    rank: number;
    percentile: number;
    category: string;
  };

  // Predictive insights
  improvementPredictions: {
    metric: string;
    current: number;
    projected: number;
    confidence: number;
  }[];

  // Real-time signals
  activeTriggers: string[];
  recommendations: string[];
  lastUpdate: Date;
}

export function AdvancedAnalytics() {
  const [analytics, setAnalytics] = useState<AdvancedAnalytics | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'hour' | 'day' | 'week' | 'month'>('hour');
  const [showPredictions, setShowPredictions] = useState(false);

  // Simulate real-time data streaming
  useEffect(() => {
    const interval = setInterval(() => {
      setAnalytics(prev => {
        if (!prev) return generateInitialAnalytics();

        const now = Date.now();
        const newMetric: PerformanceMetric = {
          timestamp: now,
          argumentQuality: Math.max(0, prev.performanceHistory[prev.performanceHistory.length - 1].argumentQuality + (Math.random() - 0.5) * 10),
          persuasionScore: Math.max(0, prev.performanceHistory[prev.performanceHistory.length - 1].persuasionScore + (Math.random() - 0.5) * 8),
          logicScore: Math.max(0, prev.performanceHistory[prev.performanceHistory.length - 1].logicScore + (Math.random() - 0.5) * 6),
          evidenceScore: Math.max(0, prev.performanceHistory[prev.performanceHistory.length - 1].evidenceScore + (Math.random() - 0.5) * 4),
          engagementScore: Math.max(0, prev.performanceHistory[prev.performanceHistory.length - 1].engagementScore + (Math.random() - 0.5) * 12),
          responseTime: Math.max(100, prev.performanceHistory[prev.performanceHistory.length - 1].responseTime + (Math.random() - 0.5) * 50),
        };

        const updatedHistory = [...prev.performanceHistory, newMetric];
        if (updatedHistory.length > 1000) updatedHistory.shift();

        // Calculate statistics
        const avgQuality = updatedHistory.reduce((sum, m) => sum + m.argumentQuality, 0) / updatedHistory.length;
        const avgPersuasion = updatedHistory.reduce((sum, m) => sum + m.persuasionScore, 0) / updatedHistory.length;

        // Determine trend
        const recentScore = updatedHistory.slice(-10).reduce((sum, m) => sum + m.argumentQuality, 0) / 10;
        const olderScore = updatedHistory.slice(-20, -10).reduce((sum, m) => sum + m.argumentQuality, 0) / 10;
        let trend: 'improving' | 'stable' | 'declining' = 'stable';
        if (recentScore > olderScore * 1.05) trend = 'improving';
        else if (recentScore < olderScore * 0.95) trend = 'declining';

        // Detect triggers
        const triggers: string[] = [];
        if (avgPersuasion < 60) triggers.push('Low persuasion detected');
        if (newMetric.responseTime > 2000) triggers.push('Slow response time');
        if (updatedHistory.some(m => m.evidenceScore < 40)) triggers.push('Evidence strength declining');

        // Generate recommendations
        const recommendations: string[] = [];
        if (avgPersuasion < 65) recommendations.push('Focus on emotional intelligence techniques');
        if (newMetric.responseTime > 1500) recommendations.push('Practice structured thinking for faster responses');
        if (updatedHistory.some(m => m.logicScore < 50)) recommendations.push('Work on logical reasoning exercises');

        return {
          ...prev,
          performanceHistory: updatedHistory,
          overallTrend: trend,
          activeTriggers: triggers,
          recommendations,
          lastUpdate: new Date(),
        };
      });
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  const generateInitialAnalytics = (): AdvancedAnalytics => {
    const baseHistory: PerformanceMetric[] = [];
    for (let i = 0; i < 100; i++) {
      baseHistory.push({
        timestamp: Date.now() - (100 - i) * 60000,
        argumentQuality: Math.random() * 40 + 60,
        persuasionScore: Math.random() * 30 + 65,
        logicScore: Math.random() * 35 + 60,
        evidenceScore: Math.random() * 40 + 55,
        engagementScore: Math.random() * 25 + 75,
        responseTime: Math.random() * 1000 + 500,
      });
    }

    return {
      performanceHistory: baseHistory,
      currentStreak: 3,
      bestStreak: 7,
      overallTrend: 'improving',
      skillVelocity: {
        logic: 2.3,
        evidence: 1.8,
        persuasion: 3.1,
        structure: 2.7,
        emotional: 1.9,
      },
      weakAreas: ['Statistical evidence', 'Emotional appeal'],
      strongAreas: ['Logical structure', 'Current events knowledge'],
      learningRate: 0.68,
      peerComparison: {
        rank: 12,
        percentile: 72,
        category: 'Intermediate Debaters',
      },
      improvementPredictions: [
        { metric: 'argumentQuality', current: 73, projected: 85, confidence: 0.8 },
        { metric: 'persuasionScore', current: 68, projected: 82, confidence: 0.7 },
        { metric: 'evidenceScore', current: 67, projected: 79, confidence: 0.75 },
      ],
      activeTriggers: [],
      recommendations: [],
      lastUpdate: new Date(),
    };
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return '#10B981';
      case 'declining': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp size={16} className="text-green-600" />;
      case 'declining': return <AlertTriangle size={16} className="text-red-600" />;
      default: return <Activity size={16} className="text-gray-600" />;
    }
  };

  // Prepare chart data
  const prepareChartData = () => {
    return analytics?.performanceHistory.slice(-20).map((metric, idx) => ({
      time: formatTime(metric.timestamp),
      'Argument Quality': metric.argumentQuality,
      'Persuasion': metric.persuasionScore,
      'Logic': metric.logicScore,
      'Evidence': metric.evidenceScore,
    })) || [];
  };

  const prepareSkillRadarData = () => {
    if (!analytics) return [];
    return Object.entries(analytics.skillVelocity).map(([skill, value]) => ({ skill, value, fill: '#E8852E' }));
  };

  return (
    <div className="space-y-4">
      {/* Live Status Bar */}
      <div className="flex items-center justify-between p-4 rounded-lg backdrop-blur-xl"
           style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.08)' }}>
        <div className="flex items-center gap-3">
          <div className={cn("w-3 h-3 rounded-full", isLive ? "bg-green-500 animate-pulse" : "bg-gray-400")} />
          <span className="text-sm font-medium" style={{ color: '#2D2D2D' }}>
            {isLive ? 'Live Analytics Active' : 'Analytics Offline'}
          </span>
          {analytics && (
            <span className="text-xs" style={{ color: '#9A9A9A' }}>
              Last update: {analytics.lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Trend Indicator */}
        {analytics && (
          <div className="flex items-center gap-2">
            {getTrendIcon(analytics.overallTrend)}
            <span className="text-xs font-medium capitalize" style={{ color: getTrendColor(analytics.overallTrend) }}>{analytics.overallTrend}</span>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="px-3 py-1 rounded-lg text-xs lg-subtle"
          >
            <option value="hour">Hour</option>
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
          <button
            onClick={() => setIsLive(!isLive)}
            className="px-3 py-1 rounded-lg text-xs font-medium transition-all hover:scale-[1.02]"
            style={{ background: isLive ? 'rgba(239,68,68,0.1)', color: '#DC2626', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            {isLive ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={() => setShowPredictions(!showPredictions)}
            className={cn("px-3 py-1 rounded-lg text-xs font-medium transition-all hover:scale-[1.02]", showPredictions ? 'lg-button' : 'lg-subtle')
          >
            {showPredictions ? 'Hide' : 'Show'} Predictions
          </button>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Performance Chart */}
        <div className="lg:col-span-2 rounded-xl p-5 backdrop-blur-xl"
             style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.08)' }}>
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: '#2D2D2D' }}>
            <BarChart3 size={16} style={{ color: '#E8852E' }} />
            Performance Trends
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={prepareChartData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="time" stroke="rgba(0,0,0,0.15)" fontSize={10} />
                <YAxis stroke="rgba(0,0,0,0.15)" fontSize={10} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #2D2D2D', borderRadius: 8 }}
                  formatter={(value, name) => [`${value.toFixed(1)}%`, name]}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="Argument Quality" stroke="#FF9F4C" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Persuasion" stroke="#E8852E" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Logic" stroke="#FFB366" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Evidence" stroke="#FFD4A8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skill Radar Chart */}
        <div className="rounded-xl p-5 backdrop-blur-xl"
             style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.08)' }}>
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: '#2D2D2D' }}>
            <Brain size={16} style={{ color: '#E8852E' }} />
            Skill Profile
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={prepareSkillRadarData()}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ skill, value }) => `${skill}: ${value}`}
                  labelLine={false}
                >
                  {prepareSkillRadarData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Performance Metrics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="rounded-lg p-4 backdrop-blur-xl"
               style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.08)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Target size={14} style={{ color: '#E8852E' }} />
              <span className="text-xs font-medium" style={{ color: '#2D2D2D' }}>Current Streak</span>
            </div>
            <p className="text-xl font-bold" style={{ color: '#E8852E' }}>{analytics.currentStreak}</p>
            <p className="text-xs" style={{ color: '#9A9A9A' }}>Best: {analytics.bestStreak}</p>
          </div>

          <div className="rounded-lg p-4 backdrop-blur-xl"
               style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.08)' }}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} style={{ color: '#E8852E' }} />
              <span className="text-xs font-medium" style={{ color: '#2D2D2D' }}>Learning Rate</span>
            </div>
            <p className="text-xl font-bold" style={{ color: '#E8852E' }}>{(analytics.learningRate * 100).toFixed(0)}%</p>
            <p className="text-xs" style={{ color: '#9A9A9A' }}>Skill improvement speed</p>
          </div>

          <div className="rounded-lg p-4 backdrop-blur-xl"
               style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.08)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Users size={14} style={{ color: '#E8852E' }} />
              <span className="text-xs font-medium" style={{ color: '#2D2D2D' }}>Peer Rank</span>
            </div>
            <p className="text-xl font-bold" style={{ color: '#E8852E' }}>#{analytics.peerComparison.rank}</p>
            <p className="text-xs" style={{ color: '#9A9A9A' }}>{analytics.peerComparison.percentile}% in {analytics.peerComparison.category}</p>
          </div>

          <div className="rounded-lg p-4 backdrop-blur-xl"
               style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.08)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Clock size={14} style={{ color: '#E8852E' }} />
              <span className="text-xs font-medium" style={{ color: '#2D2D2D' }}>Response Time</span>
            </div>
            <p className="text-xl font-bold" style={{ color: '#E8852E' }}>{analytics.performanceHistory[analytics.performanceHistory.length - 1].responseTime.toFixed(0)}ms</p>
            <p className="text-xs" style={{ color: '#9A9A9A' }}>Average per argument</p>
          </div>
        </div>
      )}

      {/* Active Triggers & Predictions */}
      {analytics && (analytics.activeTriggers.length > 0 || analytics.recommendations.length > 0 || showPredictions) && (
        <div className="rounded-xl p-5 backdrop-blur-xl"
             style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.08)' }}>
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: '#2D2D2D' }}>
            <AlertTriangle size={16} style={{ color: '#E8852E' }} />
            Insights & Predictions
          </h3>

          {/* Triggers */}
          {analytics.activeTriggers.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium mb-2" style={{ color: '#9A9A9A' }}>Active Triggers:</p>
              <div className="flex flex-wrap gap-2">
                {analytics.activeTriggers.map((trigger, idx) => (
                  <span key={idx} className="px-2 py-1 rounded text-xs font-medium" style={{ background: 'rgba(239,68,68,0.1)', color: '#DC2626', border: '1px solid rgba(239,68,68,0.3)' }}>{trigger}</span>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {analytics.recommendations.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium mb-2" style={{ color: '#9A9A9A' }}>AI Recommendations:</p>
              <ul className="space-y-1">
                {analytics.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-xs flex items-start gap-1">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span style={{ color: '#6B6B6B' }}>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Predictions */}
          {showPredictions && analytics.improvementPredictions.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: '#9A9A9A' }}>Projected Improvements:</p>
              <div className="space-y-2">
                {analytics.improvementPredictions.map((pred, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-xs font-medium" style={{ color: '#2D2D2D' }}>{pred.metric}</p>
                      <div className="w-full h-1.5 rounded-full mt-1" style={{ background: 'rgba(0,0,0,0.08)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            background: 'linear-gradient(90deg, #E8852E, #FFB366)',
                            width: `${pred.projected}%`,
                            opacity: 0.7
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold" style={{ color: '#E8852E' }}>{pred.current}%</p>
                      <p className="text-[10px]" style={{ color: '#9A9A9A' }}>→ {pred.projected}% (conf: {pred.confidence * 100}%)</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}