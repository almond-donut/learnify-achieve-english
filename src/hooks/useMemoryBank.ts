import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface MemoryEntry {
  id: string;
  entry_type: string;
  content: any;
  context_tags: string[];
  importance_score: number;
  created_at: string;
}

export interface LearningPattern {
  id: string;
  pattern_type: string;
  pattern_data: any;
  confidence_score: number;
  last_updated: string;
}

export interface ContextSession {
  id: string;
  session_start: string;
  session_end?: string;
  activities: any[];
  performance_metrics: any;
  context_summary?: string;
  total_duration_minutes: number;
}

export interface MemoryRecommendation {
  recommendation_type: string;
  recommendation_data: any;
  confidence_score: number;
}

export interface MemoryContext {
  activityType: string;
  performance?: any;
  difficulty?: string;
  topics?: string[];
  duration?: number;
  metadata?: any;
}

export const useMemoryBank = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [learningPatterns, setLearningPatterns] = useState<LearningPattern[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<MemoryRecommendation[]>([]);
  const [loading, setLoading] = useState(false);

  // Add a memory entry
  const addMemoryEntry = useCallback(async (
    entryType: string,
    content: any,
    contextTags: string[] = [],
    importanceScore: number = 0.5,
    expiresDays?: number
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.rpc('add_memory_entry', {
        p_user_id: user.id,
        p_entry_type: entryType,
        p_content: content,
        p_context_tags: contextTags,
        p_importance_score: importanceScore,
        p_expires_days: expiresDays
      });

      if (error) throw error;

      // Refresh memories
      await getRelevantMemories();
      
      return data;
    } catch (error) {
      console.error('Error adding memory entry:', error);
      toast({
        title: "Error",
        description: "Failed to save memory entry",
        variant: "destructive",
      });
      return null;
    }
  }, [user, toast]);

  // Get relevant memories
  const getRelevantMemories = useCallback(async (
    entryTypes?: string[],
    contextTags?: string[],
    limit: number = 10
  ) => {
    if (!user) return [];

    try {
      const { data, error } = await supabase.rpc('get_relevant_memories', {
        p_user_id: user.id,
        p_entry_types: entryTypes,
        p_context_tags: contextTags,
        p_limit: limit
      });

      if (error) throw error;

      setMemories(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching memories:', error);
      return [];
    }
  }, [user]);

  // Update learning pattern
  const updateLearningPattern = useCallback(async (
    patternType: string,
    patternData: any,
    confidenceScore: number = 0.5
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.rpc('update_learning_pattern', {
        p_user_id: user.id,
        p_pattern_type: patternType,
        p_pattern_data: patternData,
        p_confidence_score: confidenceScore
      });

      if (error) throw error;

      // Refresh patterns
      await getLearningPatterns();
      
      return data;
    } catch (error) {
      console.error('Error updating learning pattern:', error);
      toast({
        title: "Error",
        description: "Failed to update learning pattern",
        variant: "destructive",
      });
      return null;
    }
  }, [user, toast]);

  // Get learning patterns
  const getLearningPatterns = useCallback(async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('learning_patterns')
        .select('*')
        .eq('user_id', user.id)
        .order('confidence_score', { ascending: false });

      if (error) throw error;

      setLearningPatterns(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching learning patterns:', error);
      return [];
    }
  }, [user]);

  // Start context session
  const startContextSession = useCallback(async () => {
    if (!user || currentSession) return null;

    try {
      const { data, error } = await supabase.rpc('start_context_session', {
        p_user_id: user.id
      });

      if (error) throw error;

      setCurrentSession(data);
      
      // Store session start in memory
      await addMemoryEntry(
        'session_start',
        { 
          session_id: data,
          timestamp: new Date().toISOString() 
        },
        ['session', 'start'],
        0.3,
        7 // Expire after 7 days
      );

      return data;
    } catch (error) {
      console.error('Error starting context session:', error);
      toast({
        title: "Error",
        description: "Failed to start session tracking",
        variant: "destructive",
      });
      return null;
    }
  }, [user, currentSession, addMemoryEntry, toast]);

  // End context session
  const endContextSession = useCallback(async (
    activities: any[] = [],
    performanceMetrics: any = {},
    contextSummary?: string
  ) => {
    if (!user || !currentSession) return false;

    try {
      const { data, error } = await supabase.rpc('end_context_session', {
        p_session_id: currentSession,
        p_activities: activities,
        p_performance_metrics: performanceMetrics,
        p_context_summary: contextSummary
      });

      if (error) throw error;

      // Store session summary in memory
      await addMemoryEntry(
        'session_summary',
        {
          session_id: currentSession,
          activities,
          performance_metrics: performanceMetrics,
          context_summary: contextSummary,
          timestamp: new Date().toISOString()
        },
        ['session', 'summary', 'performance'],
        0.7,
        30 // Expire after 30 days
      );

      setCurrentSession(null);
      return true;
    } catch (error) {
      console.error('Error ending context session:', error);
      toast({
        title: "Error",
        description: "Failed to end session tracking",
        variant: "destructive",
      });
      return false;
    }
  }, [user, currentSession, addMemoryEntry, toast]);

  // Generate recommendations
  const generateRecommendations = useCallback(async () => {
    if (!user) return [];

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('generate_memory_recommendations', {
        p_user_id: user.id
      });

      if (error) throw error;

      setRecommendations(data || []);
      
      // Store recommendations in memory
      await addMemoryEntry(
        'recommendations_generated',
        { 
          recommendations: data,
          timestamp: new Date().toISOString() 
        },
        ['recommendations', 'system'],
        0.5,
        3 // Expire after 3 days
      );

      return data || [];
    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast({
        title: "Error",
        description: "Failed to generate recommendations",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, addMemoryEntry, toast]);

  // Record learning context
  const recordLearningContext = useCallback(async (context: MemoryContext) => {
    if (!user) return;

    const { activityType, performance, difficulty, topics, duration, metadata } = context;

    // Add to memory bank
    await addMemoryEntry(
      'learning_context',
      {
        activity_type: activityType,
        performance,
        difficulty,
        topics,
        duration,
        metadata,
        timestamp: new Date().toISOString()
      },
      [
        'learning',
        activityType,
        ...(difficulty ? [difficulty] : []),
        ...(topics || [])
      ],
      0.6,
      60 // Expire after 60 days
    );

    // Update learning patterns based on context
    if (performance) {
      await updateLearningPattern(
        'performance_pattern',
        {
          activity_type: activityType,
          recent_performance: performance,
          difficulty,
          timestamp: new Date().toISOString()
        },
        0.7
      );
    }

    if (duration) {
      await updateLearningPattern(
        'time_preference',
        {
          activity_type: activityType,
          duration,
          timestamp: new Date().toISOString()
        },
        0.6
      );
    }
  }, [user, addMemoryEntry, updateLearningPattern]);

  // Get personalized insights
  const getPersonalizedInsights = useCallback(async () => {
    if (!user) return null;

    try {
      // Fetch recent memories and patterns
      const recentMemories = await getRelevantMemories(
        ['learning_context', 'session_summary'],
        undefined,
        20
      );

      const patterns = await getLearningPatterns();

      // Analyze patterns for insights
      const insights = {
        preferredStudyTimes: [],
        strongTopics: [],
        challengingAreas: [],
        streakPatterns: [],
        recommendedActions: []
      };

      // Process learning contexts
      const learningContexts = recentMemories
        .filter(m => m.entry_type === 'learning_context')
        .map(m => m.content);

      // Analyze performance patterns with proper type casting
      const performancePattern = patterns.find(p => p.pattern_type === 'performance_pattern');
      if (performancePattern && performancePattern.pattern_data) {
        const data = performancePattern.pattern_data as any;
        if (data.recent_performance?.score > 0.8) {
          insights.strongTopics.push(data.activity_type);
        } else if (data.recent_performance?.score < 0.6) {
          insights.challengingAreas.push(data.activity_type);
        }
      }

      // Analyze time preferences with proper type casting
      const timePattern = patterns.find(p => p.pattern_type === 'time_preference');
      if (timePattern && timePattern.pattern_data) {
        const data = timePattern.pattern_data as any;
        insights.preferredStudyTimes.push(`${data.duration} minutes for ${data.activity_type}`);
      }

      return insights;
    } catch (error) {
      console.error('Error getting personalized insights:', error);
      return null;
    }
  }, [user, getRelevantMemories, getLearningPatterns]);

  // Initialize memory system
  useEffect(() => {
    if (user) {
      getRelevantMemories();
      getLearningPatterns();
      generateRecommendations();
    }
  }, [user, getRelevantMemories, getLearningPatterns, generateRecommendations]);

  // Auto-start session when user becomes active
  useEffect(() => {
    if (user && !currentSession) {
      startContextSession();
    }
  }, [user, currentSession, startContextSession]);

  // Auto-end session on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentSession) {
        endContextSession([], {}, 'Session ended due to page unload');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentSession, endContextSession]);

  return {
    // State
    memories,
    learningPatterns,
    currentSession,
    recommendations,
    loading,

    // Actions
    addMemoryEntry,
    getRelevantMemories,
    updateLearningPattern,
    getLearningPatterns,
    startContextSession,
    endContextSession,
    generateRecommendations,
    recordLearningContext,
    getPersonalizedInsights
  };
};
