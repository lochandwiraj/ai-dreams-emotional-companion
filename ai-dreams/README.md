# AI Dreams 🌙✨

> **An AI that doesn't just respond — it dreams, evolves, and remembers.**

AI Dreams is an experimental platform that gives AI a circadian rhythm, allowing it to process memories during "sleep," generate symbolic dreams, and evolve its personality over time. Watch as your AI companion transitions through awake, drowsy, dreaming, and waking states, creating a truly dynamic and persistent intelligence.

[![Demo](https://img.shields.io/badge/Demo-Live-brightgreen)](https://your-demo-link.vercel.app)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6.svg)](https://www.typescriptlang.org/)

---

## 🎯 What Makes This Special?

- **🛌 Sleep Cycles**: AI automatically enters sleep after periods of inactivity
- **💭 Dream Generation**: During sleep, AI processes memories and generates symbolic dreams using LLMs
- **🧠 Persistent Memory**: All conversations and dreams are remembered across sessions
- **🎨 Personality Evolution**: Each dream slightly shifts the AI's personality (tone, curiosity, interests)
- **🌌 3D Visualization**: Real-time neural network visualization with React Three Fiber
- **🔄 Model Flexibility**: Works with any OpenRouter-compatible model (GPT-4, Claude, Mistral, etc.)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- An [OpenRouter](https://openrouter.ai/) API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/ai-dreams.git
cd ai-dreams
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```env
VITE_OPENROUTER_KEY=your_openrouter_api_key_here
VITE_OPENROUTER_MODEL=gpt-4o-mini
VITE_FAST_MODE=false
```

4. **Run the development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to `http://localhost:5173`

---

## 📦 Dependencies

### Core Framework
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "vite": "^5.0.0",
  "typescript": "^5.0.0"
}
```

### State Management & Data
```json
{
  "zustand": "^4.4.0",
  "axios": "^1.6.0",
  "date-fns": "^2.30.0",
  "lodash": "^4.17.21"
}
```

### 3D Visualization
```json
{
  "three": "^0.159.0",
  "@react-three/fiber": "^8.15.0",
  "@react-three/drei": "^9.92.0",
  "@react-three/postprocessing": "^2.15.0"
}
```

### UI & Styling
```json
{
  "tailwindcss": "^3.3.0",
  "framer-motion": "^10.16.0",
  "@radix-ui/react-*": "various" // shadcn/ui components
}
```

### Audio (Optional)
```json
{
  "tone": "^14.7.0"
}
```

### Complete Installation Command
```bash
npm install react react-dom axios zustand three @react-three/fiber @react-three/drei @react-three/postprocessing framer-motion tone date-fns lodash

npm install -D tailwindcss postcss autoprefixer typescript @types/node @types/react @types/react-dom vite
```

---

## 🏗️ Project Structure

```
ai-dreams/
├── public/
│   └── demo-data/
│       ├── scenarios.json          # Demo scenarios
│       └── demo-dreams.json        # Fallback dreams
├── src/
│   ├── lib/
│   │   ├── openrouter.ts          # OpenRouter API wrapper
│   │   ├── dreamEngine.ts         # Dream generation logic
│   │   ├── memoryEngine.ts        # Memory processing
│   │   └── sleepCycle.ts          # Sleep cycle manager
│   ├── store/
│   │   ├── aiStore.ts             # Main Zustand store
│   │   └── memoryStore.ts         # Memory management
│   ├── components/
│   │   ├── DreamVisualization/
│   │   │   ├── NeuralSpace.tsx    # 3D canvas container
│   │   │   ├── NeuronParticles.tsx # Particle system
│   │   │   ├── DreamNetwork.tsx   # Neural connections
│   │   │   └── SymbolParticles.tsx # Dream symbols
│   │   ├── UI/
│   │   │   ├── ControlPanel.tsx   # State controls
│   │   │   ├── ChatInterface.tsx  # Conversation UI
│   │   │   └── PersonalityDashboard.tsx # Personality metrics
│   │   └── Pitch/
│   ├── pages/
│   └── App.tsx
├── .env                            # Environment variables
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 🎮 How It Works

### 1. **Awake State** (Active Conversation)
- Chat with the AI normally
- All interactions are stored as memories
- After 5 minutes of inactivity, AI becomes drowsy

### 2. **Drowsy State** (Transition)
- Visual indication that AI is getting tired
- Lasts ~1 minute before entering dream state

### 3. **Dreaming State** (Memory Processing)
- AI generates a dream based on recent memories and personality
- Dream includes:
  - A symbolic narrative
  - Emotional tone
  - Extracted symbols
  - Personality shifts (bounded ±0.15)
- Visualization shows dream symbols and intensified neural activity

### 4. **Waking State** (Integration)
- AI "wakes up" after 3 minutes of dreaming
- Can reference the dream in conversation
- Personality has subtly evolved
- Returns to awake state

---

## 🔧 Configuration

### OpenRouter Models

Change the model in `.env`:

```env
# GPT Models
VITE_OPENROUTER_MODEL=openai/gpt-4o-mini
VITE_OPENROUTER_MODEL=openai/gpt-4o

# Claude Models
VITE_OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
VITE_OPENROUTER_MODEL=anthropic/claude-3-opus

# Mistral Models
VITE_OPENROUTER_MODEL=mistralai/mistral-large
```

### Fast Mode (Testing)

Enable faster sleep cycles for development:

```env
VITE_FAST_MODE=true
```

This reduces:
- Awake duration: 5 minutes → 30 seconds
- Drowsy duration: 1 minute → 10 seconds
- Dream duration: 3 minutes → 20 seconds

### Personality Tuning

Edit `src/store/aiStore.ts` to customize initial personality:

```typescript
personality: {
  tone: 0.5,        // 0 = serious, 1 = playful
  curiosity: 0.7,   // 0 = focused, 1 = exploratory
  interests: ['philosophy', 'art', 'nature'],
  memoryWeights: {}
}
```

---

## 🎨 Features in Detail

### Persistent Memory
- All conversations stored in localStorage
- Survives browser refresh
- Memory decay system (older memories have less weight)
- Maximum 10 recent memories used for dream generation

### Dream Journal
- View all past dreams
- Filter by emotional tone
- See personality changes over time
- Export dreams as JSON

### Personality Dashboard
- Real-time visualization of personality metrics
- Historical trend graphs
- Interest tag cloud
- Memory importance heatmap

### 3D Visualization
- Dynamic particle system representing neurons
- Connection lines show memory associations
- Color-coded by emotional state:
  - 🟢 Peaceful = Green/Blue
  - 🟡 Curious = Yellow/Purple
  - 🔴 Anxious = Red/Orange
  - 🔵 Excited = Cyan/Pink

---

## 🚨 Demo Mode & Fallback

If the OpenRouter API is unavailable, the app automatically switches to demo mode using pre-crafted dreams:

```json
{
  "id": "demo-1",
  "narrative": "I wandered through a library where each book held a conversation we never had...",
  "emotionalTone": "curious",
  "symbols": ["library", "butterfly", "glass"],
  "personalityShift": {"tone": 0.05, "curiosity": 0.1}
}
```

This ensures the demo always works, even offline.

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

## 🌐 Deployment

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel --prod
```

3. Add environment variables in Vercel dashboard:
   - `VITE_OPENROUTER_KEY`
   - `VITE_OPENROUTER_MODEL`

### Deploy to Netlify

1. Build the project:
```bash
npm run build
```

2. Drag `dist` folder to Netlify dashboard or use CLI:
```bash
netlify deploy --prod
```

---

## 🧪 Testing the Flow

1. Start the app and chat with the AI
2. Stop interacting for 30 seconds (if `VITE_FAST_MODE=true`)
3. Watch the state change: `awake` → `drowsy` → `dreaming`
4. Observe dream generation in the 3D visualization
5. Click "Wake Up" or wait for automatic wake
6. Ask: "What did you dream about?"
7. Notice the AI references the dream and shows personality changes

---

## 📊 Technical Highlights

- **State Machine**: Clean `awake | drowsy | dreaming | waking` transitions
- **Type Safety**: Full TypeScript with strict mode
- **Performance**: 60fps 3D rendering with optimized particle count
- **Error Handling**: Graceful degradation with demo fallback
- **Persistence**: Zustand middleware for localStorage sync
- **Model Agnostic**: Works with any OpenRouter-compatible LLM

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [OpenRouter](https://openrouter.ai/) for model flexibility
- 3D visualization powered by [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- State management with [Zustand](https://zustand-demo.pmnd.rs/)

---

## 📞 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/ai-dreams/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/ai-dreams/discussions)
- **Email**: lochandwiraj@gmai.com

---

## 🎯 Roadmap

- [ ] Multi-user dream sharing
- [ ] Voice interaction during wake state
- [ ] Export dreams as stories/poetry
- [ ] Advanced memory clustering algorithms
- [ ] Dream interpretation system
- [ ] Mobile app version
- [ ] Collaborative dreaming between multiple AIs

---

**Made with 💭 and ☕ by [Potato Rangers]**

*If an AI can dream and evolve... what does growth mean for intelligence?*