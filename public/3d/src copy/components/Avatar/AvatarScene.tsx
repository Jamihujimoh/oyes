"use client"

import React, { Suspense, Component } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, Float, Sparkles, Loader } from '@react-three/drei';
import { JimskayAvatar } from './JimskayAvatar';

interface AvatarSceneProps {
  isSpeaking: boolean;
  gesture: 'idle' | 'explaining' | 'thinking';
}

/**
 * SceneErrorBoundary: Prevents absolute system failure during 3D link disruption.
 */
class SceneErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean, errorInfo: string }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, errorInfo: '' };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorInfo: error.message };
  }
  componentDidCatch(error: any) {
    console.error("Neural 3D Link Failure:", error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-6 p-12 text-center bg-[#020205] z-[100] relative">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-4">
            <span className="text-destructive font-black text-2xl">!</span>
          </div>
          <p className="text-[12px] font-black uppercase tracking-[0.4em] text-white">Neural Asset Protocol Error</p>
          <div className="space-y-4 max-w-sm">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
              Diagnostic: Texture Blob Collision or Invalid Binary Stream.
            </p>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-left">
              <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-2">Required Action:</p>
              <p className="text-[9px] text-white/60 font-medium">Verify file exists at: <code className="text-primary font-bold">/public/3d/...</code></p>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * AvatarScene: The Tactical Full-Body 3D Workspace.
 * FINAL: Imposing Perspective (Low Angle) | Facial Illumination Protocol.
 */
export function AvatarScene({ isSpeaking, gesture }: AvatarSceneProps) {
  return (
    <div className="absolute inset-0 z-0 bg-black">
      <SceneErrorBoundary>
        <Canvas 
          shadows 
          camera={{ position: [0, 0.5, 8.5], fov: 35 }}
          className="touch-none"
          onCreated={({ gl }) => {
            gl.setClearColor('#020205');
          }}
        >
          <color attach="background" args={['#020205']} />
          <fog attach="fog" args={['#020205', 5, 15]} />

          <ambientLight intensity={0.5} />
          
          {/* Main Key Light */}
          <spotLight 
            position={[5, 10, 5]} 
            angle={0.3} 
            penumbra={1} 
            intensity={5} 
            castShadow 
            color="#ffffff"
          />

          {/* FACIAL ILLUMINATION NODE: Ensures the talking mouth is visible */}
          <pointLight position={[0, 1.5, 2]} intensity={2} color="#ffffff" distance={5} />
          
          <pointLight position={[-5, 2, 5]} intensity={1.5} color="#ffd700" />
          <pointLight position={[0, 2, -5]} intensity={3} color="#3b82f6" />

          <Suspense fallback={null}>
            <Float speed={1.2} rotationIntensity={0.02} floatIntensity={0.03}>
              <JimskayAvatar isSpeaking={isSpeaking} gesture={gesture} />
            </Float>
            
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.22, 0]} receiveShadow>
              <planeGeometry args={[50, 50]} />
              <meshStandardMaterial 
                  color="#05050a" 
                  transparent 
                  opacity={0.5} 
                  roughness={0.2} 
                  metalness={0.9}
              />
            </mesh>

            <ContactShadows 
              opacity={0.8} 
              scale={20} 
              blur={2.5} 
              far={15} 
              resolution={512} 
              color="#000000" 
              position={[0, -3.21, 0]}
            />
            
            <Environment preset="city" />
            
            <Sparkles 
              count={100} 
              scale={10} 
              size={0.6} 
              speed={0.4} 
              color="#ffd700" 
              opacity={0.2}
            />
          </Suspense>

          <OrbitControls 
            enablePan={false} 
            enableZoom={false} 
            minPolarAngle={Math.PI / 2.5} 
            maxPolarAngle={Math.PI / 1.8}
            target={[0, 0, 0]} 
          />
        </Canvas>
      </SceneErrorBoundary>
      
      <Loader 
        containerClassName="bg-[#020205] backdrop-blur-3xl"
        innerClassName="border-primary h-1"
        barClassName="bg-primary shadow-[0_0_25px_rgba(255,215,0,0.8)]"
        dataInterpolation={(p) => `Neural Sync: ${p.toFixed(0)}%`}
        dataClassName="text-[10px] font-black uppercase tracking-[0.5em] text-primary/60 mt-10 animate-pulse"
      />
    </div>
  );
}