import { createContext, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { Robot3D, FloatingSymbols, OrbitRings, Sparkles } from './Robot3D';

interface MouseState { x: number; y: number; }
const MouseContext = createContext<React.MutableRefObject<MouseState>>({ current: { x: 0, y: 0 } });

function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.7} color="#e8f4fd" />
      <directionalLight position={[5, 8, 5]} intensity={1.1} color="#f0f8ff" />
      <directionalLight position={[-4, 3, -2]} intensity={0.3} color="#d0eaf8" />
      <pointLight position={[2, 3, 3]} intensity={0.35} color="#e0f0fa" distance={12} />
      <pointLight position={[-2, 2, -1]} intensity={0.2} color="#d0e8f8" distance={10} />
      <spotLight position={[0, 6, 4]} angle={0.5} penumbra={0.8} intensity={0.35} color="#f0f8ff" distance={15} />
      <pointLight position={[0, 2, -3]} intensity={0.25} color="#e0f0fa" distance={8} />
    </>
  );
}

function PostProcessing() {
  return (
    <EffectComposer>
      <Bloom luminanceThreshold={0.65} luminanceSmoothing={0.55} intensity={0.3} mipmapBlur />
      <Vignette eskil={false} offset={0.12} darkness={0.2} />
    </EffectComposer>
  );
}

function Scene({ mouseRef }: { mouseRef: React.MutableRefObject<MouseState> }) {
  return (
    <MouseContext.Provider value={mouseRef}>
      <SceneLighting />
      <Environment preset="city" environmentIntensity={0.2} />
      <Robot3D />
      <FloatingSymbols />
      <OrbitRings />
      <Sparkles />
      <PostProcessing />
    </MouseContext.Provider>
  );
}

function HeroScene3D({ className = "w-full h-full absolute inset-0 pointer-events-auto" }: { className?: string }) {
  const mouseRef = useRef<MouseState>({ x: 0, y: 0 });

  const handlePointerMove = (e: React.PointerEvent | React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement)?.getBoundingClientRect?.();
    if (!rect) return;
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  };

  return (
    <div
      className={className}
      onPointerMove={handlePointerMove}
      onMouseMove={handlePointerMove}
      style={{ touchAction: 'none' }}
    >
      <Canvas
        camera={{ position: [0, 1.1, 3.6], fov: 40 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
        style={{ pointerEvents: 'none', width: '100%', height: '100%' }}
      >
        <Scene mouseRef={mouseRef} />
      </Canvas>
    </div>
  );
}

export default HeroScene3D;
export { MouseContext };
