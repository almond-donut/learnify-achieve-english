import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface MemoryEntry {
  id: string;
  type: string;
  content: any;
  tags: string[];
  importance: number;
  timestamp: string;
}

interface LearningPattern {
  type: string;
  data: any;
  confidence: number;
  lastUpdated: string;
}

interface MemoryContextType {
  memories: MemoryEntry[];
  patterns: LearningPattern[];
  addMemory: (type: string, content: any, tags?: string[], importance?: number) => void;
  updatePattern: (type: string, data: any, confidence?: number) => void;
  getRelevantMemories: (tags?: string[], limit?: number) => MemoryEntry[];
  generateInsights: () => string[];
  recordLearningSession: (activityType: string, performance: any, duration: number) => void;
}

const MemoryContext = createContext<MemoryContextType | undefined>(undefined);

interface MemoryProviderProps {
  children: ReactNode;
}

export const MemoryProvider: React.FC<MemoryProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [patterns, setPatterns] = useState<LearningPattern[]>([]);

  // Load memories from localStorage
  useEffect(() => {
    if (user) {
      const savedMemories = localStorage.getItem(`memories_${user.id}`);
      const savedPatterns = localStorage.getItem(`patterns_${user.id}`);
      
      if (savedMemories) {
        setMemories(JSON.parse(savedMemories));
      }
      
      if (savedPatterns) {
        setPatterns(JSON.parse(savedPatterns));
      }
    }
  }, [user]);

  // Save memories to localStorage
  useEffect(() => {
    if (user && memories.length > 0) {
      localStorage.setItem(`memories_${user.id}`, JSON.stringify(memories));
    }
  }, [user, memories]);

  // Save patterns to localStorage
  useEffect(() => {
    if (user && patterns.length > 0) {
      localStorage.setItem(`patterns_${user.id}`, JSON.stringify(patterns));
    }
  }, [user, patterns]);

  const addMemory = (type: string, content: any, tags: string[] = [], importance: number = 0.5) => {
    const newMemory: MemoryEntry = {
      id: `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      tags,
      importance,
      timestamp: new Date().toISOString()
    };

    setMemories(prev => {
      const updated = [newMemory, ...prev];
      // Keep only the last 100 memories to prevent storage overflow
      return updated.slice(0, 100);
    });
  };

  const updatePattern = (type: string, data: any, confidence: number = 0.5) => {
    setPatterns(prev => {
      const existingIndex = prev.findIndex(p => p.type === type);
      const newPattern: LearningPattern = {
        type,
        data,
        confidence,
        lastUpdated: new Date().toISOString()
      };

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newPattern;
        return updated;
      } else {
        return [...prev, newPattern];
      }
    });
  };

  const getRelevantMemories = (tags: string[] = [], limit: number = 10): MemoryEntry[] => {
    let filtered = memories;

    if (tags.length > 0) {
      filtered = memories.filter(memory => 
        tags.some(tag => memory.tags.includes(tag))
      );
    }

    // Sort by importance and recency
    filtered.sort((a, b) => {
      const importanceDiff = b.importance - a.importance;
      if (Math.abs(importanceDiff) > 0.1) return importanceDiff;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return filtered.slice(0, limit);
  };

  const generateInsights = (): string[] => {
    const insights: string[] = [];

    // Analyze session patterns
    const sessionMemories = memories.filter(m => m.type === 'learning_session');
    if (sessionMemories.length >= 3) {
      const avgPerformance = sessionMemories.reduce((sum, m) => 
        sum + (m.content.performance?.score || 0), 0
      ) / sessionMemories.length;

      if (avgPerformance > 0.8) {
        insights.push('You\'re performing exceptionally well! Consider increasing difficulty to maintain challenge.');
      } else if (avgPerformance < 0.6) {
        insights.push('Consider taking shorter breaks between sessions or reducing difficulty slightly.');
      }

      // Analyze timing patterns
      const sessionTimes = sessionMemories.map(m => new Date(m.timestamp).getHours());
      const morningCount = sessionTimes.filter(h => h >= 6 && h <= 11).length;
      const afternoonCount = sessionTimes.filter(h => h >= 12 && h <= 17).length;
      const eveningCount = sessionTimes.filter(h => h >= 18 || h <= 5).length;

      const maxCount = Math.max(morningCount, afternoonCount, eveningCount);
      if (maxCount === morningCount && morningCount > sessionTimes.length * 0.4) {
        insights.push('You tend to perform better during morning sessions. Consider scheduling more morning study time.');
      } else if (maxCount === eveningCount && eveningCount > sessionTimes.length * 0.4) {
        insights.push('Evening study sessions work well for you. You might be a night learner!');
      }
    }

    // Analyze achievement patterns
    const achievementMemories = memories.filter(m => m.type === 'achievement');
    if (achievementMemories.length >= 2) {
      const recentAchievements = achievementMemories.filter(m => 
        Date.now() - new Date(m.timestamp).getTime() < 7 * 24 * 60 * 60 * 1000 // Last 7 days
      );
      
      if (recentAchievements.length >= 2) {
        insights.push('Great momentum! You\'ve unlocked multiple achievements recently. Keep up the consistency!');
      }
    }

    // Analyze learning patterns
    const performancePattern = patterns.find(p => p.type === 'performance_trend');
    if (performancePattern && performancePattern.confidence > 0.6) {
      const trend = performancePattern.data.trend;
      if (trend === 'improving') {
        insights.push('Your performance shows a clear improvement trend. You\'re on the right track!');
      } else if (trend === 'declining') {
        insights.push('Consider adjusting your study approach or taking a short break to avoid burnout.');
      }
    }

    return insights.length > 0 ? insights : [
      'Keep studying consistently to build meaningful learning patterns!',
      'Your learning journey is just beginning. Every session counts!'
    ];
  };

  const recordLearningSession = (activityType: string, performance: any, duration: number) => {
    // Add session memory
    addMemory(
      'learning_session',
      {
        activityType,
        performance,
        duration,
        timestamp: new Date().toISOString()
      },
      [activityType, 'session', performance.score > 0.7 ? 'good_performance' : 'needs_improvement'],
      performance.score > 0.8 ? 0.8 : 0.5
    );

    // Update performance pattern
    const recentSessions = memories.filter(m => 
      m.type === 'learning_session' && 
      Date.now() - new Date(m.timestamp).getTime() < 7 * 24 * 60 * 60 * 1000
    );

    if (recentSessions.length >= 2) {
      const scores = recentSessions.map(s => s.content.performance?.score || 0);
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const trend = scores.length >= 3 ? 
        (scores[0] > scores[scores.length - 1] ? 'improving' : 
         scores[0] < scores[scores.length - 1] ? 'declining' : 'stable') : 'stable';

      updatePattern(
        'performance_trend',
        {
          averageScore: avgScore,
          trend,
          activityType,
          sessionCount: recentSessions.length
        },
        0.7
      );
    }

    // Update time preference pattern
    const hour = new Date().getHours();
    const timeCategory = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    
    updatePattern(
      'time_preference',
      {
        preferredTime: timeCategory,
        lastSessionTime: hour,
        performance: performance.score
      },
      0.6
    );
  };

  const value: MemoryContextType = {
    memories,
    patterns,
    addMemory,
    updatePattern,
    getRelevantMemories,
    generateInsights,
    recordLearningSession
  };

  return (
    <MemoryContext.Provider value={value}>
      {children}
    </MemoryContext.Provider>
  );
};

export const useMemory = () => {
  const context = useContext(MemoryContext);
  if (context === undefined) {
    throw new Error('useMemory must be used within a MemoryProvider');
  }
  return context;
};
