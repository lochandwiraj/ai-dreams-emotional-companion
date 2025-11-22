<div align="center">

# 🌙 **AI Dreams – Emotional Companion**
### *An AI that dreams about you, learns from you, and supports your emotional world.*

Built with 💜 by **Potato Rangers 🥔**

---

### 🎧 Emotion-Aware • 🧠 Learns Your Patterns • 🌌 Dreams & Evolves • 🎵 Plays Therapeutic Music  
</div>

---

# 📌 **Table of Contents**
- [What Is This?](#-what-is-this)
- [✨ Key Features](#-key-features)
- [🚀 Quick Start](#-quick-start)
- [🎮 How to Use](#-how-to-use)
- [🏗️ Project Architecture](#️-project-architecture)
- [🤖 Component Ownership](#-component-ownership)
- [📦 Tech Stack](#-tech-stack)
- [🎨 Audio Library](#-audio-library)
- [🧪 Testing Scenarios](#-testing-scenarios)
- [🚀 Deployment](#-deployment)
- [🔐 Privacy & Safety](#-privacy--safety)
- [🛠️ Development](#️-development)
- [🗺️ Roadmap](#-roadmap)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [🙏 Acknowledgments](#-acknowledgments)
- [👥 Team](#-team)
- [💭 Philosophy](#-philosophy)

---

# 🎯 **What Is This?**

**AI Dreams Emotional Companion** is a deeply personalized mental wellness AI system that:

- 🎭 Understands your emotions  
- 💬 Responds empathetically  
- 🎵 Suggests therapeutic audio  
- 🧘 Guides meditation-style visualizations  
- 🧠 Learns what supports you best  
- 💭 Processes memories through *dream cycles*  
- 🌌 Shows neural 3D visualizations while dreaming  

Unlike typical chatbots, this AI **remembers you**, evolves through dreams, grows more empathetic, and adapts to your emotional patterns.

---

# ✨ **Key Features**

## 🎭 **1. Real-Time Emotion Detection**
- Identifies emotional states: *sad, anxious, stressed, angry, lonely, excited*
- Confidence scoring for accuracy
- Tracks recurring emotional patterns

## 💚 **2. Intelligent Emotional Responses**
- Empathetic, gentle listening
- Context-aware visualizations (30s–5 min)
- Affirmations & reflective messaging
- Practical, calming advice
- Learns what has helped you before

## 🎵 **3. Therapeutic Audio System**
- Ambient, nature, meditation, binaural, instrumental
- Smart emotion → audio matching
- Smooth transitions & auto-play playlists
- Learns your preferred sounds

## 🧘 **4. Immersive Visualization Mode**
- Full-screen guided meditations
- Sentence-by-sentence narration
- Integrated emotion-appropriate audio
- Beautiful animated scene

## 🧠 **5. Preference Learning**
- Every response has 👍/👎 feedback
- Adjusts behavior & suggestions
- Builds long-term personalization

## 💭 **6. Dream-Based Memory Processing**
- AI sleeps after inactivity  
- Dreams combine your emotions + memories  
- Personality changes over time  
- 3D neural network visualization in real time  

## 📊 **7. Emotional Wellness Tracking**
- Timeline of emotional states
- Pattern recognition
- Topic mapping & triggers
- Personalized insights

---

# 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+
- npm or yarn
- OpenRouter API Key

---

### **1. Clone the repo**
```bash
git clone https://github.com/lochandwiraj/ai-dreams-emotional-companion.git
cd ai-dreams-emotional-companion
```

### **2. Install dependencies**
```bash
npm install
```

### **3. Add environment variables**

Create `.env`:

```env
VITE_OPENROUTER_KEY=your_api_key_here
VITE_OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
VITE_FAST_MODE=false
```

### **4. Run dev server**
```bash
npm run dev
```

Open → **http://localhost:5173**

---

# 🎮 **How to Use**

### 🗣 **Chat**
Type how you're feeling → AI responds with empathy & guidance.

### 🧘 **Guided Visualizations**
AI detects emotional intensity → offers calming scenes with audio.

### 🎵 **Therapeutic Music**
AI automatically picks music based on:
- your mood  
- preferences  
- past helpful patterns  

### 🌙 **Dream Cycles**
If inactive:
- AI becomes *drowsy → dreaming → awake*  
- Generates symbolic dreams based on your emotions  
- Personality subtly adjusts  
- You can ask: **“What did you dream?”**

---

# 🏗️ **Project Architecture**
```
ai-dreams-emotional-companion/
├── public/
│   └── audio/
├── src/
│   ├── lib/            # Person A – Logic & Models
│   ├── content/        # Person B – Responses & Scripts
│   ├── audio/          # Person C – Music System
│   ├── components/     # Person D – UI Integration
│   ├── store/          # Zustand stores
│   └── App.tsx
```

---

# 🤖 **Component Ownership**

| Person | Domain | Responsibilities |
|--------|---------|------------------|
| **A** | Logic & Models | Emotion detection, memory engine, dream logic |
| **B** | Conversations | Responses, guided scripts, empathy |
| **C** | Audio | Music library, playlists, audio engine |
| **D** | UI & Integration | Chat UI, dashboards, 3D integration |

---

# 📦 **Tech Stack**

- **React 18** + TypeScript  
- **Vite 5**  
- **Zustand**  
- **React Three Fiber + Drei**  
- **Tailwind + shadcn/ui**  
- **Framer Motion**  
- **OpenRouter API**  

---

# 🎨 **Audio Library**
Includes **30+ tracks**:
- Ambient pads  
- Nature rain/forest/ocean  
- Meditation bowls  
- Binaural beats (432Hz, 528Hz)  
- Soft piano & guitar  

All tracks:
- Royalty-free  
- Normalized  
- Optimized for web  

---

# 🧪 **Testing Scenarios**
Includes detailed flows for:
- Anxiety  
- Sadness  
- Overwhelm  
- Crisis safety detection  

---

# 🚀 **Deployment**

### **Vercel**
```
npm i -g vercel
vercel --prod
```

### **Netlify**
```
npm run build
netlify deploy --prod
```

---

# 🔐 **Privacy & Safety**
- All data stored **locally** (no server)  
- Crisis detection built-in  
- Zero medical advice  
- User-controlled data deletion  

---

# 🛠️ **Development Scripts**
```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run type-check
```

---

# 🗺️ **Roadmap**
### **Phase 1 — Core (Done)**
Emotion detection, visualizations, audio, dreams

### **Phase 2 — Enhancements**
- Voice mode  
- Analytics dashboard  
- Multi-language support  

### **Phase 3 — Expansion**
- Group therapy mode  
- Therapist dashboard  
- Wearable integrations  

---

# 🤝 **Contributing**
Pull requests welcome!  
Create branch → Commit → PR.

---

# 📄 **License**
MIT License.

---

# 🙏 **Acknowledgments**
- OpenRouter  
- React Three Fiber  
- Pixabay / Incompetech (audio)  
- Anthropic Claude  

---

# 👥 **Team – Potato Rangers 🥔**

| Role | Name |
|------|------|
| Logic Architect | Person A |
| Content Designer | Person B |
| Audio Engineer | Person C |
| Integration Lead | Person D |

---

# 💭 **Philosophy**
> *“If an AI can dream about you, learn what comforts you, and grow with you…  
> what does companionship mean in the age of artificial intelligence?”*

This project explores emotional AI, persistent intelligence, symbolic dreaming, and the future of compassionate computation.
