// src/lib/conversationEngine.ts

// ---------------------------------------------------------
// IMPORTS
// ---------------------------------------------------------
import { addMemoryWithAnalysis } from "./memoryEngine";
import { useAIStore } from "../store/aiStore";

// Emotional brain
import { getUnifiedEmotion } from "./emotionRuntimeAdapter";

// Context + topics
import { extractEntities } from "./contextExtractor";
import { contextStore } from "./contextStore";
import { topicStore } from "./topicStore";

// Feedback & preferences
import { recordFeedback } from "./feedbackEngine";

// Dream system
import { generateWakeResponse, generateDream } from "./dreamEngine";

// OpenRouter client
import { chat } from "./openrouter";

// Types
import type { RuntimeEmotion } from "./emotionRuntimeAdapter";


// ---------------------------------------------------------
// CONVERSATION ENGINE — MAIN ENTRY POINT
// ---------------------------------------------------------

export async function handleUserMessage(message: string) {
  const ai = useAIStore.getState();

  // -----------------------------------------------------
  // 1. STORE RAW USER MESSAGE → BOTH STORES
  // -----------------------------------------------------
  const userMemoryContent = `User: ${message}`;
  
  // ✅ FIX: Add to BOTH stores
  addMemoryWithAnalysis(userMemoryContent);  // memoryStore
  ai.addMemory(userMemoryContent, 0.6);       // aiStore (for particles!)
  
  console.log("💾 Memory added to both stores");

  // -----------------------------------------------------
  // 2. UPDATE CONTEXT + TOPICS
  // -----------------------------------------------------
  try {
    const ctx = await extractEntities(message);
    contextStore.addContext(ctx);

    // Add topics into topicStore
    for (const t of [...ctx.activities, ...ctx.triggers, ...ctx.comforts]) {
      topicStore.addOrUpdateTopic(t, {
        emotion: "neutral",
        intensity: 0.5,
      });
    }
  } catch (err) {
    console.warn("[ConversationEngine] Context extraction failed:", err);
  }

  // -----------------------------------------------------
  // 3. CHECK WAKE STATE
  // -----------------------------------------------------
  const justWoke =
    ai.state === "waking" ||
    (ai.currentDream &&
      Date.now() - new Date(ai.currentDream.timestamp).getTime() < 60000);

  // -----------------------------------------------------
  // 4. GET UNIFIED EMOTIONAL STATE
  // -----------------------------------------------------
  let unifiedEmotion: RuntimeEmotion;

  try {
    unifiedEmotion = await getUnifiedEmotion();
  } catch (err) {
    console.error("[ConversationEngine] Unified Emotion failed:", err);

    // Safe fallback
    unifiedEmotion = {
      payload: {
        emotion: "neutral",
        intensity: 0.5,
        confidence: 0.5,
        detectedAt: new Date().toISOString(),
      },
      stability: {
        stabilityIndex: 0.6,
        correctedEmotion: "neutral",
        correctedIntensity: 0.5,
        volatilityClass: "stable",
        issues: [],
        generatedAt: new Date().toISOString(),
      },
      harmonized: {
        unifiedEmotion: "neutral",
        unifiedIntensity: 0.5,
        contributingSignals: [],
        reliability: 0.5,
        generatedAt: new Date().toISOString(),
      },
      safety: {
        ok: true,
        issues: [],
        generatedAt: new Date().toISOString(),
      },
      emittedAt: new Date().toISOString(),
    };
  }

  // -----------------------------------------------------
  // 5. DREAM WAKE BRIDGE
  // -----------------------------------------------------
  let response: string;

  if (justWoke && ai.currentDream) {
    response = await generateWakeResponse(
      ai.currentDream,
      message,
      ai.personality,
      unifiedEmotion
    );
  } else {
    // ---------------------------------------------------
    // 6. NORMAL AWAKE RESPONSE
    // ---------------------------------------------------
    const emotionalSummary = `
Emotion: ${unifiedEmotion.harmonized.unifiedEmotion}
Intensity: ${unifiedEmotion.harmonized.unifiedIntensity}
Stability: ${unifiedEmotion.stability.stabilityIndex}
Reliability: ${unifiedEmotion.harmonized.reliability}
    `.trim();

    const prompt = `
You are an emotionally intelligent AI companion.

Here is your emotional context:
${emotionalSummary}

User said: "${message}"

Respond with:
- empathy
- grounding if needed
- gentle tone
- clear next steps
- emotional reflection
Do NOT mention emotions or analysis explicitly.
    `;

    try {
      response = await chat([{ role: "user", content: prompt }]);
    } catch (err) {
      console.error("[ConversationEngine] LLM failure:", err);
      response = `I heard you say: "${message}". I'm with you.`;
    }
  }

  // -----------------------------------------------------
  // 7. AUTO FEEDBACK (lightweight)
  // -----------------------------------------------------
  try {
    await recordFeedback({
      responseType: "conversation",
      emotion: unifiedEmotion.harmonized.unifiedEmotion,
      helpful: true,
      optionalNote: message,
    });
  } catch (err) {
    console.warn("[ConversationEngine] Feedback failed:", err);
  }

  // -----------------------------------------------------
  // 8. DREAM TRIGGER LOGIC
  // -----------------------------------------------------
  const shouldDream =
    ai.state === "drowsy" ||
    unifiedEmotion.harmonized.unifiedIntensity > 0.75 ||
    unifiedEmotion.stability.volatilityClass === "erratic";

  if (shouldDream && ai.state !== "dreaming") {
    try {
      ai.transitionTo("dreaming");

      const mems = useAIStore
        .getState()
        .memories.slice(-10)
        .map((m) => m.fullMessage);

      const dream = await generateDream(mems, ai.personality);
      ai.processDream(dream);

      // Move immediately to waking
      setTimeout(() => ai.transitionTo("waking"), 500);
    } catch (err) {
      console.error("[ConversationEngine] Dream generation error:", err);
    }
  }

  // -----------------------------------------------------
  // 9. STORE AI RESPONSE → BOTH STORES
  // -----------------------------------------------------
  const aiMemoryContent = `AI: ${response}`;
  
  // ✅ FIX: Add to BOTH stores
  addMemoryWithAnalysis(aiMemoryContent);  // memoryStore
  ai.addMemory(aiMemoryContent, 0.5);       // aiStore (for particles!)
  
  console.log("💾 AI response added to both stores");

  // -----------------------------------------------------
  // 10. UPDATE LAST INTERACTION
  // -----------------------------------------------------
  ai.updateLastInteraction();

  // -----------------------------------------------------
  // 11. RETURN FINAL RESPONSE
  // -----------------------------------------------------
  return response;
}