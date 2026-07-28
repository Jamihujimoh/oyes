"use client"

import * as THREE from 'three';
import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';

interface JimskayAvatarProps {
  isSpeaking: boolean;
  gesture: 'idle' | 'explaining' | 'thinking';
}

/**
 * JimskayAvatar: The High-Fidelity 3D Human Duplicate.
 * FINAL: Massive Scale Protocol (4.2x) | Rotation Lock (180deg).
 * HARDENED LIP-SYNC: Neural Morph Scan for automatic facial articulation.
 */
export function JimskayAvatar({ isSpeaking, gesture }: JimskayAvatarProps) {
  const group = useRef<THREE.Group>(null);
  // Literal filename path for local asset synchronization
  const modelUrl = "/3d/A futuristic AI assistant standing naturally _variant1 (1).glb";

  // Load high-fidelity asset
  const { scene, animations } = useGLTF(modelUrl);
  const { actions } = useAnimations(animations, group);

  // Sector: Morph Target Discovery
  // We scan the entire mesh for anything that looks like a mouth or jaw controller
  const morphTargets = useMemo(() => {
    const targets: { mesh: THREE.Mesh; dictionary: { [key: string]: number }; mouthIndices: number[] }[] = [];
    
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).morphTargetDictionary) {
        const mesh = child as THREE.Mesh;
        const dict = mesh.morphTargetDictionary!;
        const mouthIndices: number[] = [];
        
        // NEURAL SCAN: Find any index that controls the mouth/jaw/visemes
        Object.keys(dict).forEach(key => {
          const lowerKey = key.toLowerCase();
          if (
            lowerKey.includes('mouth') || 
            lowerKey.includes('jaw') || 
            lowerKey.includes('viseme') || 
            lowerKey.includes('vowel') ||
            lowerKey.includes('tongue') ||
            ['a', 'e', 'i', 'o', 'u'].includes(lowerKey)
          ) {
            mouthIndices.push(dict[key]);
          }
        });

        if (mouthIndices.length > 0) {
          targets.push({ mesh, dictionary: dict, mouthIndices });
        }
      }
    });
    return targets;
  }, [scene]);

  // Sector: Animation Command Logic
  useEffect(() => {
    if (!actions) return;
    
    // Smooth transition between skeletal states
    Object.values(actions).forEach(a => a?.fadeOut(0.5));

    let targetName = 'idle';
    if (gesture === 'explaining' || isSpeaking) targetName = 'talk';
    else if (gesture === 'thinking') targetName = 'think';

    const trackNames = Object.keys(actions);
    // Aggressive Fuzzy Search for tracks
    const match = trackNames.find(n => n.toLowerCase().includes(targetName)) || trackNames[0];

    if (match && actions[match]) {
      actions[match]?.reset().fadeIn(0.5).play();
    }
  }, [actions, gesture, isSpeaking]);

  // Sector: Procedural Kinetic Frame Updates
  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (group.current) {
      // Subtle biological micro-sway for sentient realism
      group.current.rotation.y = Math.PI + Math.sin(t * 0.2) * 0.005; 
      group.current.position.y = -3.2 + Math.sin(t * 0.5) * 0.004;
    }

    // ABSOLUTE LIP-SYNC PROTOCOL
    if (morphTargets.length > 0) {
      // Procedural mouth oscillation triggered by speech state
      // We use a complex sine to simulate natural speech jitter
      const mouthOpenness = isSpeaking ? (Math.sin(t * 22) + Math.sin(t * 11) * 0.5 + 1) * 0.4 : 0;
      
      morphTargets.forEach(({ mesh, mouthIndices }) => {
        const influences = mesh.morphTargetInfluences;
        if (!influences) return;
        
        mouthIndices.forEach(idx => {
          influences[idx] = THREE.MathUtils.lerp(influences[idx], mouthOpenness, 0.4);
        });
      });
    }
  });

  // MASSIVE SCALE: 4.2x | POSITION: -3.2 (Grounded) | ROTATION: Math.PI (Face Forward)
  return (
    <group ref={group} scale={4.2} position={[0, -3.2, 0]} rotation={[0, Math.PI, 0]} dispose={null}>
      <primitive object={scene} dispose={null} />
    </group>
  );
}

// Preload the specific high-fidelity asset
useGLTF.preload("/3d/A futuristic AI assistant standing naturally _variant1 (1).glb");