# 🌙 AI Dreams – Emotional Companion

> An AI that dreams about you, learns from you, and supports your emotional world.

**Built with 💜 by Potato Rangers 🥔**

[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.2-646cff.svg)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🎯 What Is This?

**AI Dreams Emotional Companion** is a deeply personalized mental wellness AI that:

- 🎭 **Understands your emotions** - Detects 8 emotional states automatically
- 💬 **Responds empathetically** - Context-aware, compassionate responses
- 🎵 **Plays therapeutic audio** - Smart emotion-based music recommendations
- 🧘 **Guides visualizations** - Full-screen calming meditation experiences
- 🧠 **Learns your patterns** - Adapts based on your feedback
- 💭 **Dreams & evolves** - Processes memories during sleep cycles
- 🌌 **Beautiful 3D visuals** - Real-time neural network visualization

Unlike typical chatbots, this AI **remembers you**, **evolves through dreams**, and **adapts to your emotional patterns**.

---

## ✨ Key Features

### 🎭 Real-Time Emotion Detection
- Automatically detects: **sad**, **anxious**, **stressed**, **angry**, **lonely**, **excited**, **calm**, **neutral**
- 100+ keyword patterns for accurate detection
- Confidence scoring and intensity tracking

### 💚 Intelligent Emotional Responses
- Empathetic, gentle listening
- Context-aware suggestions
- Affirmations & reflective messaging
- Learns what helps you best

### 🎵 Therapeutic Audio System
- **5 categories**: Ambient, Nature, Meditation, Binaural, Instrumental
- **10+ tracks**: Rain, ocean, singing bowls, 432Hz/528Hz frequencies
- Auto-play based on emotion and intensity
- Learns your audio preferences

### 🧘 Immersive Visualization Mode
- Full-screen guided meditations
- Sentence-by-sentence narration
- 5 scene types: Forest, Ocean, Mountain, Space, Garden
- Integrated emotion-appropriate audio

### 🧠 Preference Learning
- 👍/👎 feedback on every response
- Adjusts behavior over time
- Builds long-term personalization

### 💭 Dream-Based Memory Processing
- AI sleeps after 3 minutes of inactivity
- Dreams combine emotions + memories
- Personality evolves subtly
- 3D neural visualization during dreams

### 📊 Emotional Wellness Tracking
- Timeline of emotional states
- Pattern recognition
- Personalized insights
- Visual emotion history

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** and npm
- **OpenRouter API Key** ([Get one here](https://openrouter.ai/))

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/lochandwiraj/ai-dreams-emotional-companion.git
cd ai-dreams-emotional-companion
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:
```env
VITE_OPENROUTER_KEY=your_api_key_here
VITE_OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
VITE_FAST_MODE=false
```

4. **Run the development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to `http://localhost:5173`

---

## 🎮 How to Use

### 💬 Chat with the AI
1. Type how you're feeling in the chat box (bottom-left)
2. The AI automatically detects your emotion
3. Receive empathetic responses with suggestions
4. Give feedback with 👍 or 👎 to help it learn

### 🎵 Therapeutic Audio
1. Click **Therapeutic Audio** (top-right)
2. Browse recommended tracks for your emotion
3. Click any track to play
4. Adjust volume with the slider
5. Audio auto-plays for intense emotions

### 🧘 Guided Visualizations
1. When AI detects strong emotions, it suggests visualizations
2. Click the ✨ sparkle icon next to a message
3. Experience full-screen calming meditation
4. Press ESC or click X to exit

### 🌙 Dream Cycles
1. Stop interacting for 3 minutes
2. AI becomes **drowsy** (blue particles)
3. AI enters **dreaming** (light purple particles)
4. AI **wakes up** after 1 minute
5. Ask: "What did you dream about?"

### 🎮 AI System Control (Top-Right)
- **Dreaming** - Force dream state
- **Drowsy** - Make AI sleepy
- **Awake** - Active state
- **Waking** - Transition state
- **Toggle Dream** - Wake AI early
- **Clear Memory** - Reset all data

### 📊 Emotional Dashboard (Bottom-Right)
- View recent emotional timeline
- See emotion patterns
- Get personalized insights

---

## 🏗️ Project Structure

```
ai-dreams-emotional-companion/
├── public/
│   └── demo-data/
│       └── demo-dreams.json
├── src/
│   ├── lib/
│   │   ├── emotionDetection.ts       # Emotion detection engine
│   │   ├── emotionalResponseEngine.ts # Empathetic response generation
│   │   ├── audioEngine.ts            # Therapeutic audio system
│   │   ├── visualizationEngine.ts    # Guided meditation scripts
│   │   ├── dreamEngine.ts            # Dream generation logic
│   │   ├── memoryEngine.ts           # Memory processing
│   │   ├── sleepCycle.ts             # Sleep cycle manager
│   │   └── openrouter.ts             # OpenRouter API wrapper
│   ├── components/
│   │   ├── EmotionalChat.tsx         # Main chat interface
│   │   ├── AudioPlayer.tsx           # Audio player UI
│   │   ├── VisualizationMode.tsx     # Full-screen meditation
│   │   ├── EmotionalDashboard.tsx    # Wellness tracking
│   │   ├── DreamVisualization/       # 3D neural visualization
│   │   └── ui/                       # UI components
│   ├── store/
│   │   └── aiStore.ts                # Zustand state management
│   └── App.tsx
├── .env                               # Environment variables
├── package.json
└── README.md
```

---

## 📦 Tech Stack

- **React 19** + **TypeScript 5.9**
- **Vite 7.2** - Lightning-fast build tool
- **Zustand** - State management
- **React Three Fiber** + **Drei** - 3D visualization
- **Tailwind CSS** + **shadcn/ui** - Styling
- **Framer Motion** - Animations
- **OpenRouter API** - LLM integration

---

## ⚙️ Configuration

### Model Selection

**Recommended (Best Empathy):**
```env
VITE_OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
```

**Budget-Friendly:**
```env
VITE_OPENROUTER_MODEL=openai/gpt-4o-mini
```

**Maximum Quality:**
```env
VITE_OPENROUTER_MODEL=anthropic/claude-3-opus
```

### Fast Mode (Testing)

Enable faster sleep cycles for development:
```env
VITE_FAST_MODE=true
```

Changes:
- Awake: 3 min → 30 sec
- Drowsy: 30 sec → 10 sec
- Dreaming: 1 min → 20 sec

---

## 🎨 Features in Detail

### Emotion Detection
Uses 100+ keyword patterns across 8 emotions:
- **Sad**: depressed, heartbroken, devastated, grief, etc.
- **Anxious**: worried, panic, terrified, on edge, etc.
- **Stressed**: overwhelmed, burnout, exhausted, etc.
- **Angry**: furious, irritated, enraged, etc.
- **Lonely**: isolated, abandoned, forgotten, etc.
- **Excited**: thrilled, ecstatic, pumped, etc.
- **Calm**: peaceful, relaxed, centered, etc.
- **Neutral**: normal, regular, ordinary, etc.

### Audio Library
- **Ambient**: Peaceful Pad, Deep Space
- **Nature**: Rain on Leaves, Forest Birds, Ocean Waves
- **Meditation**: Singing Bowl, Gentle Chimes
- **Binaural**: 432Hz Healing, 528Hz Love
- **Instrumental**: Soft Piano, Acoustic Guitar

### Visualization Scenes
- **Forest** - For sadness and grief
- **Ocean** - For anxiety and stress
- **Mountain** - For overwhelm
- **Space** - For loneliness
- **Garden** - For maintaining calm

---

## 🔐 Privacy & Safety

### What's Stored Locally
- Conversation history
- Emotional states
- Feedback preferences
- Audio preferences
- Dreams and memories

### What's Sent to OpenRouter
- Your messages
- Recent conversation context (last 3 messages)
- System prompts for empathy

### What's NOT Stored
- ❌ No server-side storage
- ❌ No analytics tracking
- ❌ No third-party sharing

### Clear Your Data
Click **🧹 Clear Memory** to delete all local data instantly.

---

## 🆘 Crisis Resources

**This AI is NOT a replacement for professional help.**

If you're in crisis, please reach out:

**US:**
- National Suicide Prevention Lifeline: **988**
- Crisis Text Line: Text **HOME** to **741741**

**International:**
- Find your country: [findahelpline.com](https://findahelpline.com)

---

## 🛠️ Development

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

---

## 🚀 Deployment

### Vercel
```bash
npm i -g vercel
vercel --prod
```

Add environment variables in Vercel dashboard:
- `VITE_OPENROUTER_KEY`
- `VITE_OPENROUTER_MODEL`

### Netlify
```bash
npm run build
netlify deploy --prod
```

---

## 🗺️ Roadmap

### Phase 1 — Core ✅
- [x] Emotion detection
- [x] Empathetic responses
- [x] Therapeutic audio
- [x] Guided visualizations
- [x] Dream cycles
- [x] Wellness tracking

### Phase 2 — Enhancements
- [ ] Voice interaction
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Mobile app version

### Phase 3 — Expansion
- [ ] Group therapy mode
- [ ] Therapist dashboard
- [ ] Wearable integrations
- [ ] Dream journal export

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [OpenRouter](https://openrouter.ai/) - Model flexibility
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) - 3D visualization
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
- [Anthropic Claude](https://www.anthropic.com/) - Empathetic AI

---

## 👥 Team – Potato Rangers 🥔

Built with 💜 by developers who believe in compassionate AI.

---

## 💭 Philosophy

> "If an AI can dream about you, learn what comforts you, and grow with you… what does companionship mean in the age of artificial intelligence?"

This project explores **emotional AI**, **persistent intelligence**, **symbolic dreaming**, and the future of **compassionate computation**.

---

## 📞 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/lochandwiraj/ai-dreams-emotional-companion/issues)
- **Email**: lochandwiraj@gmail.com

---

**Made with 💜 by Potato Rangers**

*An AI that doesn't just respond — it dreams, evolves, and remembers.*
