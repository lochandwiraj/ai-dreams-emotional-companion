import { useAIStore } from '../../store/aiStore';

export default function LoadingOverlay() {
  const state = useAIStore((s) => s.state);
  
  if (state !== 'dreaming') return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-pulse">💭</div>
        <div className="text-white text-xl font-light">Dreaming...</div>
      </div>
    </div>
  );
}