import { useRef, useContext, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { MouseContext } from './HeroScene3D';

const MODEL_URL = '/models/RobotExpressive.glb';

function Robot3D() {
  const group = useRef<THREE.Group>(null);
  const mouseRef = useContext(MouseContext);
  const smoothMouse = useRef({ x: 0, y: 0 });

  const { scene, animations } = useGLTF(MODEL_URL) as any;
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const headBone = useRef<THREE.Object3D | null>(null);

  // Clone scene to avoid issues with HMR
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    return clone;
  }, [scene]);

  useEffect(() => {
    if (!clonedScene) return;

    // Find head bone for cursor tracking
    clonedScene.traverse((child: THREE.Object3D) => {
      if (child.name === 'mixamorigHead' || child.name === 'Head' || child.name === 'head') {
        headBone.current = child;
      }
    });

    // Setup animation mixer
    const mixer = new THREE.AnimationMixer(clonedScene);
    mixerRef.current = mixer;

    // Play idle animation
    if (animations.length > 0) {
      // Find idle or first animation
      const idleAnim = animations.find((a: any) =>
        a.name.toLowerCase().includes('idle') ||
        a.name.toLowerCase().includes('neutral') ||
        a.name.toLowerCase().includes('wave')
      ) || animations[0];

      if (idleAnim) {
        const clip = THREE.AnimationClip.findByName(animations, idleAnim.name) || animations[0];
        const action = mixer.clipAction(clip);
        action.play();
      }
    }

    // Apply proper materials to all meshes
    clonedScene.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          if (mat.metalness !== undefined) mat.metalness = Math.min(mat.metalness, 0.3);
          if (mat.roughness !== undefined) mat.roughness = Math.max(mat.roughness, 0.3);
          mat.envMapIntensity = 0.5;
        }
      }
    });

    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(clonedScene);
    };
  }, [clonedScene, animations]);

  useFrame((_, delta) => {
    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;
    const t = performance.now() * 0.001;

    // Smooth cursor
    smoothMouse.current.x += (mx - smoothMouse.current.x) * 0.06;
    smoothMouse.current.y += (my - smoothMouse.current.y) * 0.06;
    const sx = smoothMouse.current.x;
    const sy = smoothMouse.current.y;

    // Update animation mixer
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }

    // Head bone cursor tracking
    if (headBone.current) {
      headBone.current.rotation.y += (sx * 0.4 - headBone.current.rotation.y) * 0.05;
      headBone.current.rotation.x += (-sy * 0.15 - headBone.current.rotation.x) * 0.05;
    }

    // Whole model gentle turn toward cursor
    if (group.current) {
      group.current.rotation.y += (sx * 0.15 - group.current.rotation.y) * 0.03;
      // Gentle hover
      group.current.position.y = Math.sin(t * 0.8) * 0.06;
    }
  });

  return (
    <group ref={group} position={[0, -0.9, 0]} scale={0.9}>
      <primitive object={clonedScene} />
    </group>
  );
}

/* ═══════════════════════════════════════
   FLOATING SYMBOLS — blue-tinted
   ═══════════════════════════════════════ */
function FloatingSymbols() {
  const symbols = useMemo(() => [
    { pos: [1.3, 1.6, -0.3] as [number, number, number], color: '#5ba3d9', speed: 0.4, radius: 0.2 },
    { pos: [-1.2, 1.4, 0.1] as [number, number, number], color: '#7ec8e3', speed: 0.35, radius: 0.25 },
    { pos: [0.8, 2.2, -0.5] as [number, number, number], color: '#b3d9f2', speed: 0.3, radius: 0.18 },
    { pos: [-0.9, 2.1, -0.2] as [number, number, number], color: '#3d7ab8', speed: 0.45, radius: 0.22 },
    { pos: [1.5, 0.8, 0.2] as [number, number, number], color: '#5ba3d9', speed: 0.28, radius: 0.15 },
    { pos: [-1.5, 1.0, -0.1] as [number, number, number], color: '#7ec8e3', speed: 0.38, radius: 0.2 },
    { pos: [0.0, 2.6, -0.4] as [number, number, number], color: '#8ec3e6', speed: 0.32, radius: 0.17 },
  ], []);

  const meshes = useRef<THREE.Mesh[]>([]);

  useFrame(() => {
    const t = performance.now() * 0.001;
    meshes.current.forEach((m, i) => {
      if (!m) return;
      const s = symbols[i];
      m.position.y = s.pos[1] + Math.sin(t * s.speed * 2 + i) * 0.15;
      m.position.x = s.pos[0] + Math.sin(t * s.speed * 1.3 + i * 2) * s.radius;
      m.rotation.y = t * s.speed * 0.8;
      m.rotation.z = Math.sin(t * s.speed + i) * 0.2;
      m.scale.setScalar(0.9 + Math.sin(t * 1.5 + i * 0.7) * 0.1);
    });
  });

  return (
    <group>
      {symbols.map((s, i) => (
        <mesh key={i} ref={el => { if (el) meshes.current[i] = el; }} position={s.pos}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial
            color={s.color}
            emissive={s.color}
            emissiveIntensity={0.3}
            transparent
            opacity={0.55}
            roughness={0.2}
            metalness={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════
   ORBIT RINGS
   ═══════════════════════════════════════ */
function OrbitRings() {
  const r1 = useRef<THREE.Mesh>(null);
  const r2 = useRef<THREE.Mesh>(null);
  const r3 = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const t = performance.now() * 0.001;
    if (r1.current) r1.current.rotation.z = t * 0.08;
    if (r2.current) r2.current.rotation.z = -t * 0.06;
    if (r3.current) r3.current.rotation.x = t * 0.05;
  });

  return (
    <group position={[0, 0.5, 0]}>
      <mesh ref={r1} rotation={[1.2, 0, 0]}>
        <torusGeometry args={[1.8, 0.01, 8, 64]} />
        <meshStandardMaterial color="#7ec8e3" transparent opacity={0.2} roughness={0.2} metalness={0.5} />
      </mesh>
      <mesh ref={r2} rotation={[1.5, 0.4, 0]}>
        <torusGeometry args={[2.0, 0.007, 8, 64]} />
        <meshStandardMaterial color="#5ba3d9" transparent opacity={0.14} roughness={0.2} metalness={0.5} />
      </mesh>
      <mesh ref={r3} rotation={[0.8, 0.2, 0.3]}>
        <torusGeometry args={[2.2, 0.009, 8, 64]} />
        <meshStandardMaterial color="#b3d9f2" transparent opacity={0.11} roughness={0.2} metalness={0.5} />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════
   SPARKLES
   ═══════════════════════════════════════ */
function Sparkles() {
  const count = 35;
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const data = useMemo(() =>
    Array.from({ length: count }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: 1.4 + Math.random() * 1.0,
      speed: 0.12 + Math.random() * 0.22,
      yOffset: (Math.random() - 0.5) * 1.6,
      phase: Math.random() * Math.PI * 2,
      scale: 0.012 + Math.random() * 0.018,
    })), []);

  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() * 0.001;
    data.forEach((d, i) => {
      d.angle += d.speed * 0.01;
      const x = Math.cos(d.angle) * d.radius;
      const z = Math.sin(d.angle) * d.radius * 0.5;
      const y = 0.5 + d.yOffset + Math.sin(t * 0.7 + d.phase) * 0.16;
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(d.scale * (0.85 + Math.sin(t * 2 + d.phase) * 0.15));
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color="#7ec8e3"
        emissive="#7ec8e3"
        emissiveIntensity={0.4}
        transparent
        opacity={0.45}
        roughness={0.1}
        metalness={0.35}
      />
    </instancedMesh>
  );
}

useGLTF.preload(MODEL_URL);

export { Robot3D, FloatingSymbols, OrbitRings, Sparkles };
