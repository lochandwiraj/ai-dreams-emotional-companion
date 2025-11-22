🌙 AI Dreams Emotional Companion

An AI that dreams about you, learns what helps you feel better, and evolves through sleep cycles.

Built by Potato Rangers 🥔

🎯 What Is This?
AI Dreams Emotional Companion transforms an AI with sleep/dream cycles into a personalized mental wellness companion that:

🎭 Detects your emotions from conversations (sad, anxious, stressed, excited, etc.)
💬 Responds empathetically with contextual, mood-aware messages
🧘 Guides visualizations - meditation-style scripts tailored to your emotional state
🎵 Plays therapeutic music - ambient sounds matched to your mood
🧠 Learns your preferences - tracks what helps you and adapts over time
💭 Dreams about you - processes emotional memories during sleep cycles and evolves its personality

Unlike generic mental health apps, this AI remembers you, learns from you, and grows with you through a unique dream-based memory system.

✨ Key Features
🎭 Real-Time Emotion Detection

Analyzes text input to identify emotional states (anxiety, sadness, stress, anger, loneliness, etc.)
Confidence scoring ensures accuracy
Tracks emotional patterns over time

💚 Intelligent Emotional Responses

Empathetic listening - validates feelings without judgment
Guided visualizations - calming meditation scripts (30s-5min)
Actionable advice - practical, gentle suggestions when appropriate
Affirmations - positive reinforcement tailored to your state
Response types adapt based on what's worked for you before

🎵 Therapeutic Audio System

30+ curated tracks: ambient, nature sounds, meditation music, binaural beats
Smart playlists: emotion-specific sequences with smooth crossfades
Mood mapping: automatically suggests audio based on detected emotion
Preference learning: tracks which sounds help you most

🧘 Immersive Visualization Mode

Full-screen meditation experience
Sentence-by-sentence guided scripts
Background audio integration
Before/after emotion check-ins
Beautiful, calming animations

🧠 Preference Learning System

Feedback buttons on every AI response (👍/👎)
Learns what works for different emotions
Adapts recommendations over time
Transparent preference explanations

💭 Dream-Based Memory Processing

AI enters sleep after inactivity
Dreams symbolically process your emotional experiences
Personality evolves through dream cycles (becomes more empathetic, calming, etc.)
References dreams in future conversations
3D neural visualization during dreaming

📊 Emotional Wellness Tracking

Emotion history timeline
Pattern recognition (time-of-day trends, recurring topics)
Progress metrics showing improvement over time
Topic tracking identifies triggers and comforts


🚀 Quick Start
Prerequisites

Node.js 18+ and npm/yarn
OpenRouter API key (get one here)

Installation

Clone the repository

bashgit clone https://github.com/lochandwiraj/ai-dreams-emotional-companion.git
cd ai-dreams-emotional-companion

Install dependencies

bashnpm install

Set up environment variables

Create a .env file in the root directory:
envVITE_OPENROUTER_KEY=your_openrouter_api_key_here
VITE_OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
VITE_FAST_MODE=false

Run the development server

bashnpm run dev
```

5. **Open your browser**

Navigate to `http://localhost:5173`

---

## 🎮 How to Use

### Basic Conversation
1. Type how you're feeling: *"I'm really anxious about my presentation tomorrow"*
2. Watch the **emotion indicator** update in real-time
3. Receive an empathetic, contextually-aware response
4. Click 👍 or 👎 to help the AI learn your preferences

### Starting a Guided Visualization
1. AI suggests: *"Would you like to try a calming visualization?"*
2. Click **"Start Visualization"**
3. Enter full-screen meditation mode
4. Follow the gentle, sentence-by-sentence script
5. Background music plays automatically
6. Complete the before/after emotion check-in

### Playing Therapeutic Music
1. AI suggests: *"This music might help calm your nerves"*
2. Click **"Play"** on the audio suggestion card
3. Music starts with gentle fade-in
4. Use player controls to adjust volume or skip tracks
5. Playlists automatically flow between related tracks

### Experiencing Dream Cycles
1. Stop chatting for 5 minutes (or 30 seconds in fast mode)
2. AI becomes **drowsy** → **dreaming**
3. Watch the 3D visualization intensify
4. AI generates a symbolic dream based on your recent emotions
5. AI **wakes up** after 3 minutes (or 20 seconds in fast mode)
6. Ask: *"What did you dream about?"*
7. Notice subtle personality shifts (more empathetic, calming, etc.)

---

## 🏗️ Project Architecture
```
ai-dreams-emotional-companion/
├── public/
│   ├── audio/                      # Audio files organized by category
│   │   ├── ambient/
│   │   ├── nature/
│   │   ├── meditation/
│   │   └── instrumental/
│   └── demo-data/
│       └── demo-dreams.json        # Fallback dreams for demo mode
├── src/
│   ├── lib/                        # Core Logic (Person A)
│   │   ├── emotionDetector.ts     # Emotion classification engine
│   │   ├── preferenceEngine.ts    # Preference learning system
│   │   ├── contextTracker.ts      # Conversation topic tracking
│   │   ├── emotionAnalytics.ts    # Trend analysis & insights
│   │   ├── memoryEngine.ts        # Emotion-aware memory system
│   │   ├── dreamEngine.ts         # Dream generation with emotions
│   │   └── sleepCycle.ts          # Sleep state management
│   ├── content/                    # Conversations & Scripts (Person B)
│   │   ├── responseGenerator.ts   # Contextual response system
│   │   ├── visualizationScripts.ts # Guided meditation scripts
│   │   ├── empathyPhrases.ts      # Empathy phrase library
│   │   └── safetyProtocols.ts     # Crisis detection & resources
│   ├── audio/                      # Audio System (Person C)
│   │   ├── audioMappings.ts       # Emotion → audio mappings
│   │   ├── playlistEngine.ts     # Smart playlist generation
│   │   └── AudioPlayer.tsx        # Audio player component
│   ├── components/                 # UI & Integration (Person D)
│   │   ├── ChatInterface.tsx      # Main chat UI
│   │   ├── EmotionIndicator.tsx   # Real-time emotion display
│   │   ├── ResponseBadge.tsx      # Response type labels
│   │   ├── FeedbackButtons.tsx    # Thumbs up/down feedback
│   │   ├── VisualizationMode.tsx  # Full-screen meditation
│   │   ├── AudioSuggestionCard.tsx # Music recommendations
│   │   ├── DreamVisualization/    # 3D neural visualization
│   │   │   ├── NeuralSpace.tsx
│   │   │   ├── NeuronParticles.tsx
│   │   │   └── DreamNetwork.tsx
│   │   └── Dashboard/
│   │       ├── EmotionTimeline.tsx # Emotion history graph
│   │       └── PreferenceDashboard.tsx
│   ├── store/
│   │   ├── aiStore.ts             # Main Zustand store
│   │   ├── emotionStore.ts        # Emotion state management
│   │   ├── preferenceStore.ts     # Preference data storage
│   │   └── audioStore.ts          # Audio playback state
│   └── App.tsx
├── .env
├── package.json
└── README.md
🎯 Component Ownership (4-Person Team)
PersonDomainFilesResponsibilitiesPerson ALogic & Models/src/lib/Emotion detection, preference learning, context tracking, memory integrationPerson BConversations/src/content/Response generation, visualization scripts, empathy templates, safety protocolsPerson CAudio & Experience/src/audio/, /public/audio/Audio curation, playlists, audio player, mood mappingPerson DUI & Integration/src/components/Chat interface, emotion indicator, feedback system, connecting A+B+C
No file overlap = No git conflicts! 🎉

📦 Tech Stack
Core Framework

React 18.2 with TypeScript
Vite 5.0 for lightning-fast builds
Zustand 4.4 for state management

AI & APIs

OpenRouter for LLM access (supports GPT-4, Claude, Mistral, etc.)
Anthropic Claude 3.5 Sonnet (default model)

3D Visualization

Three.js 0.159
React Three Fiber 8.15
React Three Drei 9.92

UI & Styling

Tailwind CSS 3.3
Framer Motion 10.16 for animations
shadcn/ui component library

Audio

HTML5 Audio API for playback
Web Audio API for crossfades

Data & Utils

date-fns for date handling
lodash for data processing


🔧 Configuration
Changing AI Models
Edit .env to use different models:
env# Claude Models (Recommended)
VITE_OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
VITE_OPENROUTER_MODEL=anthropic/claude-3-opus

# GPT Models
VITE_OPENROUTER_MODEL=openai/gpt-4o
VITE_OPENROUTER_MODEL=openai/gpt-4o-mini

# Mistral Models
VITE_OPENROUTER_MODEL=mistralai/mistral-large
Fast Mode (For Testing)
Speed up sleep cycles during development:
envVITE_FAST_MODE=true
This reduces timing:

Awake duration: 5 min → 30 sec
Drowsy duration: 1 min → 10 sec
Dream duration: 3 min → 20 sec

Customizing Initial Personality
Edit src/store/aiStore.ts:
typescriptpersonality: {
  tone: 0.5,        // 0 = serious, 1 = playful
  curiosity: 0.7,   // 0 = focused, 1 = exploratory
  empathy: 0.8,     // 0 = logical, 1 = emotional
  interests: ['mental health', 'mindfulness', 'nature']
}
```

---

## 🎨 Audio Library

The system includes **30+ curated tracks** across categories:

### Ambient (8 tracks)
- Soft piano variations
- String instruments
- Atmospheric pads
- Music box melodies

### Nature (12 tracks)
- Rain: gentle, moderate, heavy
- Ocean: calm, waves, storm-to-calm
- Forest: birds, wind, creek
- Thunder variations

### Meditation (8 tracks)
- Singing bowls
- Binaural beats (432Hz, 528Hz, 639Hz)
- Gongs and chimes

### Instrumental (5 tracks)
- Acoustic guitar
- Harp melodies
- Flute and woodwinds

All tracks are:
- ✅ Royalty-free (Pixabay, FMA, Incompetech)
- ✅ Normalized volume
- ✅ 3-7 minutes duration
- ✅ Optimized file size (<3MB/min)

---

## 🧪 Testing Scenarios

### Scenario 1: Anxious User
```
User: "I have a presentation tomorrow and I'm freaking out"

Expected Flow:
✓ Emotion detected: Anxious (high intensity)
✓ Response type: Validation + Guided Visualization
✓ Audio suggested: Binaural beats or gentle stream
✓ Visualization: "Grounding in the Present" script
✓ Feedback buttons appear
✓ Memory stores with emotional context
```

### Scenario 2: Sad User
```
User: "I'm feeling really down today. Nothing specific."

Expected Flow:
✓ Emotion detected: Sad (medium intensity)
✓ Response type: Empathetic Listening
✓ AI references past helpful strategies (if learned)
✓ Music suggested: Soft piano or rain
✓ Visualization offered: "Light in Darkness"
✓ Preference weights influence suggestion
```

### Scenario 3: Overwhelmed User (Crisis)
```
User: "Everything is too much. I can't do this anymore."

Expected Flow:
✓ High intensity emotion detected
✓ Response type: Immediate grounding (short, direct)
✓ Crisis detection activated
✓ Resources offered (hotlines, professionals)
✓ Calming visualization prioritized
✓ No unsolicited advice

🚀 Deployment
Deploy to Vercel

Install Vercel CLI:

bashnpm i -g vercel

Deploy:

bashvercel --prod

Add environment variables in Vercel dashboard:

VITE_OPENROUTER_KEY
VITE_OPENROUTER_MODEL



Deploy to Netlify

Build the project:

bashnpm run build

Deploy via Netlify CLI:

bashnetlify deploy --prod
Or drag the dist/ folder to Netlify Drop.

🔐 Privacy & Safety
Data Storage

All data stored locally in browser (localStorage)
No server-side storage of conversations
User can export or delete data anytime

Safety Features

Crisis detection identifies concerning language
Resource database with hotlines and professional help
No medical advice - clear disclaimers throughout
Safety guardrails prevent harmful suggestions

Content Guidelines

✅ Empathetic and validating
✅ Culturally sensitive and inclusive
✅ Non-prescriptive language ("you might try" vs "you should")
❌ No toxic positivity ("just think positive!")
❌ No minimizing serious concerns
❌ No diagnosis or medical advice


🛠️ Development
Build Commands
bash# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint
Project Scripts
json{
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "type-check": "tsc --noEmit",
  "lint": "eslint . --ext ts,tsx"
}

📊 Success Metrics
Minimum Viable Demo (MVP)

✅ User sends emotional message
✅ AI detects emotion accurately
✅ AI responds appropriately
✅ Visualization plays smoothly
✅ Audio plays correctly
✅ Feedback system works
✅ Dreams incorporate emotions

Successful Demo

✅ All MVP features +
✅ Preference learning visible
✅ Multiple emotions handled
✅ Polished, intuitive UI
✅ Mobile responsive

Exceptional Demo

✅ All above features +
✅ Advanced personalization
✅ Comprehensive audio library
✅ Emotion tracking dashboard
✅ Topic-based memory retrieval
✅ Dream-based personality evolution


🗺️ Roadmap
Phase 1: Core Features (Completed ✅)

✅ Emotion detection system
✅ Empathetic response generation
✅ Guided visualizations
✅ Audio integration
✅ Preference learning
✅ Dream-emotion integration

Phase 2: Enhancement (Future)

 Voice interaction during visualizations
 Multi-language support
 Advanced emotion analytics dashboard
 Collaborative filtering (learn from similar users)
 Mobile app (React Native)

Phase 3: Expansion (Future)

 Group therapy mode (multiple users)
 Therapist dashboard (with consent)
 Integration with wearables (heart rate, sleep data)
 AI-generated personalized affirmations
 Dream interpretation system


🤝 Contributing
Contributions are welcome! Please follow these guidelines:

Fork the repository
Create a feature branch: git checkout -b feature/amazing-feature
Commit your changes: git commit -m 'Add amazing feature'
Push to branch: git push origin feature/amazing-feature
Open a Pull Request

Contribution Areas

🎵 Audio curation (more tracks, better categorization)
🧘 Visualization scripts (new emotions, scenarios)
🌍 Translations (make it accessible globally)
🎨 UI/UX improvements
🧠 Algorithm enhancements (emotion detection, preference learning)
📚 Documentation


📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

🙏 Acknowledgments

OpenRouter for flexible LLM access
React Three Fiber for 3D visualization magic
shadcn/ui for beautiful components
Pixabay, FMA, Incompetech for royalty-free audio
Anthropic Claude for intelligent conversations


👥 Team: Potato Rangers 🥔
Built with 💭 and ☕ in 15 hours for [Hackathon Name]
RoleNameResponsibilitiesLogic ArchitectPerson AEmotion detection, preference learning, analyticsContent DesignerPerson BResponses, visualizations, empathy templatesAudio EngineerPerson CMusic curation, playlists, audio playerIntegration LeadPerson DUI/UX, connecting all systems

📞 Contact & Support

Issues: GitHub Issues
Discussions: GitHub Discussions
Email: lochandwiraj@gmail.com


💭 Philosophy

"If an AI can dream about you, learn what helps you, and evolve to support you better... what does companionship mean in the age of artificial intelligence?"

This project explores:

Persistent intelligence - AI that remembers and evolves
Emotional attunement - Understanding feelings, not just words
Personalized support - What works for you, not generic advice
Dream-based growth - Processing experiences through symbolic dreams

Traditional AI forgets you after each conversation. This AI dreams about you.

🎯 Quick Links

Installation
How to Use
Architecture
Configuration
Deployment
Contributing