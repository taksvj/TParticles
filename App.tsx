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
  
  // Camera Device State
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Interpolated expansion for smooth UI
  const targetExpansion = useRef(0.5);
  const liveServiceRef = useRef<LiveService | null>(null);

  // Fetch available video devices
  const refreshDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      setVideoDevices(videoInputs);
      
      // Auto-select first device if none selected
      if (videoInputs.length > 0) {
        // If current selection is invalid, reset to first
        const currentExists = videoInputs.find(d => d.deviceId === selectedDeviceId);
        if (!selectedDeviceId || !currentExists) {
          setSelectedDeviceId(videoInputs[0].deviceId);
        }
      }
    } catch (e) {
      console.warn("Error enumerating devices:", e);
    }
  };

  useEffect(() => {
    refreshDevices();
    navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
    return () => navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
  }, [selectedDeviceId]);

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
    try {
      // Use selected device or default
      const videoConstraints: MediaTrackConstraints = {
        width: 320,
        height: 240,
        deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined
      };

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: videoConstraints, 
        audio: true 
      });
      
      // If we successfully got a stream, refresh device list (labels might now be available)
      refreshDevices();

      const service = new LiveService((val) => {
        console.log("Gemini says expansion:", val);
        targetExpansion.current = Math.max(0, Math.min(1, val));
      });

      await service.connect(stream, stream);
      liveServiceRef.current = service;
      setIsConnected(true);

    } catch (err) {
      console.error("Connection failed:", err);
      if (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'NotFoundError')) {
         alert("Camera access failed. If you are using a phone connection, ensure DroidCam is running.");
      }
    }
  };

  const handleDeviceChange = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    // If we were connected, we'd ideally reconnect here, but for simplicity
    // we let the user re-click "Enable AI" or just update state for next connection.
    if (isConnected) {
        alert("Camera changed. Please reconnect AI to use the new source.");
        setIsConnected(false);
        if (liveServiceRef.current) {
            liveServiceRef.current.disconnect();
            liveServiceRef.current = null;
        }
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
        videoDevices={videoDevices}
        selectedDeviceId={selectedDeviceId}
        onDeviceChange={handleDeviceChange}
      />

    </div>
  );
};

export default App;
