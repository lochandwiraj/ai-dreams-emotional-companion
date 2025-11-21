import { useAIStore } from '../../store/aiStore';

const STATE_CONFIG = {
  awake: { label: 'Awake', color: 'bg-green-500', icon: '👁️' },
  drowsy: { label: 'Drowsy', color: 'bg-yellow-500', icon: '😌' },
  dreaming: { label: 'Dreaming', color: 'bg-purple-500', icon: '💭' },
  waking: { label: 'Waking', color: 'bg-blue-500', icon: '🌅' }
};

export default function StateIndicator() {
  const state = useAIStore((s) => s.state);
  const config = STATE_CONFIG[state];

  return (
    <div className="absolute top-4 left-4 flex items-center gap-3 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
      <div className={`w-3 h-3 rounded-full ${config.color} animate-pulse`} />
      <span className="text-white font-medium">{config.icon} {config.label}</span>
    </div>
  );
}