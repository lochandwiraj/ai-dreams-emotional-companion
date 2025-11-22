// Generate human-readable insights using topicTracker and patternAnalyzer

import { getTopTopics, getTopicsForEmotion, computeTopicSeverity } from './topicTracker';
import { getTriggerEmotionCorrelations } from './patternAnalyzer';

// Mock injection for testing
let mockTopicTracker: any = null;
let mockPatternAnalyzer: any = null;

function getTopicTracker() {
  return mockTopicTracker || { getTopTopics, getTopicsForEmotion, computeTopicSeverity };
}

function getPatternAnalyzer() {
  return mockPatternAnalyzer || { getTriggerEmotionCorrelations };
}

export const INSIGHT_TEMPLATES: Record<string, string> = {
  EMOTION_TOPIC_CORRELATION: "You often feel {{emotion}} when discussing {{topic}}.",
  TOPIC_FREQUENCY: "{{Topic}} has been a recurring theme in your conversations.",
  INTENSITY_PATTERN: "When {{topic}} comes up, you tend to experience higher emotional intensity.",
  COMFORT_CORRELATION: "Talking about {{topic}} often correlates with more positive emotions.",
  TRIGGER_IDENTIFICATION: "{{Topic}} appears to be a trigger for {{emotion}} feelings.",
  SEVERITY_INSIGHT: "{{Topic}} has a high emotional impact based on your recent patterns.",
  RECURRENCE_TREND: "You've mentioned {{topic}} frequently over time.",
  EMOTION_SHIFT: "Discussions about {{topic}} sometimes help shift from {{fromEmotion}} to {{toEmotion}}.",
  SUPPORT_STRATEGY: "When {{topic}} comes up, try {{strategy}} to help manage the emotions.",
  PATTERN_RECOGNITION: "Noticed a pattern: {{topic}} consistently relates to {{emotion}} states."
};

export function formatInsight(templateKey: string, data: Record<string, any>): string {
  const template = INSIGHT_TEMPLATES[templateKey];
  if (!template) {
    return `Insight about ${data.topic || 'patterns'}`;
  }

  let insight = template;
  
  // Replace all {{placeholders}} with data values
  for (const [key, value] of Object.entries(data)) {
    const placeholder = `{{${key}}}`;
    const capitalizedPlaceholder = `{{${key.charAt(0).toUpperCase() + key.slice(1)}}}`;
    
    // Replace both lowercase and capitalized versions
    insight = insight.replace(new RegExp(placeholder, 'g'), String(value));
    insight = insight.replace(new RegExp(capitalizedPlaceholder, 'g'), 
      String(value).charAt(0).toUpperCase() + String(value).slice(1));
  }

  return insight;
}

export function generateInsightsForUser(limit: number = 5): string[] {
  const insights: string[] = [];
  
  try {
    const topTopics = getTopicTracker().getTopTopics(15);
    const correlations = getPatternAnalyzer().getTriggerEmotionCorrelations(20);
    
    // Filter correlations by thresholds
    const strongCorrelations = correlations.filter(corr => 
      corr.occurrences >= 3 && corr.correlationScore >= 0.45
    );
    
    // Generate emotion-topic correlation insights
    for (const correlation of strongCorrelations.slice(0, 3)) {
      const insight = formatInsight('EMOTION_TOPIC_CORRELATION', {
        emotion: correlation.emotion,
        topic: correlation.topic
      });
      insights.push(insight);
    }
    
    // Generate frequency insights for top topics
    const frequentTopics = topTopics.filter(topic => topic.count >= 3);
    for (const topic of frequentTopics.slice(0, 2)) {
      const insight = formatInsight('TOPIC_FREQUENCY', {
        topic: topic.topic
      });
      if (!insights.includes(insight)) {
        insights.push(insight);
      }
    }
    
    // Generate intensity insights
    const highIntensityTopics = topTopics.filter(topic => topic.intensityAvg >= 7);
    for (const topic of highIntensityTopics.slice(0, 2)) {
      const insight = formatInsight('INTENSITY_PATTERN', {
        topic: topic.topic
      });
      if (!insights.includes(insight)) {
        insights.push(insight);
      }
    }
    
    // Generate comfort correlation insights
    const comfortTopics = topTopics.filter(topic => {
      const positiveEmotions = topic.emotionCounts.excited + topic.emotionCounts.neutral;
      const totalEmotions = Object.values(topic.emotionCounts).reduce((sum, count) => sum + count, 0);
      return totalEmotions > 0 && (positiveEmotions / totalEmotions) >= 0.6;
    });
    
    for (const topic of comfortTopics.slice(0, 2)) {
      const insight = formatInsight('COMFORT_CORRELATION', {
        topic: topic.topic
      });
      if (!insights.includes(insight)) {
        insights.push(insight);
      }
    }
    
    // Generate trigger identification insights
    const triggerTopics = topTopics.filter(topic => {
      const negativeEmotions = topic.emotionCounts.sad + topic.emotionCounts.angry + 
                              topic.emotionCounts.anxious + topic.emotionCounts.stressed + 
                              topic.emotionCounts.overwhelmed;
      const totalEmotions = Object.values(topic.emotionCounts).reduce((sum, count) => sum + count, 0);
      return totalEmotions > 0 && (negativeEmotions / totalEmotions) >= 0.6;
    });
    
    for (const topic of triggerTopics.slice(0, 2)) {
      const dominantEmotion = Object.entries(topic.emotionCounts)
        .sort(([, a], [, b]) => b - a)[0][0];
      
      const insight = formatInsight('TRIGGER_IDENTIFICATION', {
        topic: topic.topic,
        emotion: dominantEmotion
      });
      if (!insights.includes(insight)) {
        insights.push(insight);
      }
    }
    
  } catch (error) {
    console.error('Failed to generate user insights:', error);
  }
  
  // Remove duplicates and limit
  const uniqueInsights = [...new Set(insights)];
  return uniqueInsights.slice(0, limit);
}

export function generateInsightsForTopic(topic: string, limit: number = 3): string[] {
  const insights: string[] = [];
  
  try {
    const topicTracker = getTopicTracker();
    const topicData = topicTracker.getTopicsForEmotion('neutral', 50).find(t => t.topic === topic);
    
    if (!topicData) {
      return ["We don't have enough data about this topic yet."];
    }
    
    // Severity insight
    const severity = topicTracker.computeTopicSeverity(topic);
    if (severity >= 0.7) {
      insights.push(formatInsight('SEVERITY_INSIGHT', { topic }));
    }
    
    // Recurrence insight
    if (topicData.count >= 3) {
      insights.push(formatInsight('RECURRENCE_TREND', { topic }));
    }
    
    // Emotion pattern insights
    const emotions = Object.entries(topicData.emotionCounts)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2);
    
    if (emotions.length >= 2) {
      const [primaryEmotion, secondaryEmotion] = emotions;
      insights.push(formatInsight('EMOTION_SHIFT', {
        topic,
        fromEmotion: primaryEmotion[0],
        toEmotion: secondaryEmotion[0]
      }));
    } else if (emotions.length === 1) {
      insights.push(formatInsight('PATTERN_RECOGNITION', {
        topic,
        emotion: emotions[0][0]
      }));
    }
    
    // Strategy suggestion based on emotion patterns
    const dominantEmotion = emotions.length > 0 ? emotions[0][0] : 'neutral';
    const strategies: Record<string, string> = {
      sad: 'reflective journaling or comforting music',
      angry: 'breathing exercises or physical activity',
      anxious: 'mindfulness meditation or grounding techniques',
      stressed: 'progressive relaxation or time management',
      overwhelmed: 'breaking tasks into smaller steps or seeking support',
      lonely: 'connecting with others or engaging in social activities'
    };
    
    const strategy = strategies[dominantEmotion];
    if (strategy) {
      insights.push(formatInsight('SUPPORT_STRATEGY', {
        topic,
        strategy
      }));
    }
    
  } catch (error) {
    console.error('Failed to generate topic insights:', error);
    return ["Unable to generate insights for this topic at the moment."];
  }
  
  return insights.slice(0, limit);
}

// Testing utilities
export const __TEST_ONLY__ = {
  injectTopicTracker(tt: any): void {
    mockTopicTracker = tt;
  },
  
  injectPatternAnalyzer(pa: any): void {
    mockPatternAnalyzer = pa;
  },
  
  reset(): void {
    mockTopicTracker = null;
    mockPatternAnalyzer = null;
  }
};