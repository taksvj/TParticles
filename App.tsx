import React, { useState, useEffect, useRef } from 'react';
import { ParticleScene } from './components/ParticleScene';
import { Controls } from './components/Controls';
import { ShapeType } from './types';
import { LiveService } from './services/liveService';

const App: React.FC = () => {
  const [shape, setShape] = useState<ShapeType>(ShapeType.HEART);
  const [color, setColor] = useState<string>('#06b6d4'); // Cyan default
  const [expansion, setExpansion] = useState<number>(0.5);
  const [trailLength, setTrailLength] = useState<number>(10);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  
  // Interpolated expansion for smooth UI
  const targetExpansion = useRef(0.5);
  
  const liveServiceRef = useRef<LiveService | null>(null);

  useEffect(() => {
    // Animation loop for smooth value interpolation
    let frameId: number;
    const animate = () => {
      setExpansion(prev => {
        const diff = targetExpansion.current - prev;
        return prev + diff * 0.05; // Smooth factor
      });
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const handleConnect = async () => {
    if (!process.env.API_KEY) {
      alert("API Key missing in environment variables.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 240 }, // Low res for AI token efficiency
        audio: true // Required by Live API even if unused
      });
      
      const service = new LiveService((val) => {
        console.log("Gemini says expansion:", val);
        targetExpansion.current = Math.max(0, Math.min(1, val));
      });

      await service.connect(stream, stream); // Pass stream for both video and audio context setup
      liveServiceRef.current = service;
      setIsConnected(true);

    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera or microphone. Please allow permissions.");
    }
  };

  return (
    <div className="w-screen h-screen relative overflow-hidden bg-black text-white">
      
      {/* 3D Layer */}
      <div className="absolute inset-0 z-0">
        <ParticleScene 
          shape={shape} 
          color={color} 
          expansion={expansion}
          trailLength={trailLength}
        />
      </div>

      {/* UI Layer */}
      <Controls 
        currentShape={shape} 
        onShapeChange={setShape}
        color={color}
        onColorChange={setColor}
        trailLength={trailLength}
        onTrailLengthChange={setTrailLength}
        isConnected={isConnected}
        onConnect={handleConnect}
      />

    </div>
  );
};

export default App;
