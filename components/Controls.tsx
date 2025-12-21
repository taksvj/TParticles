import React, { useState } from 'react';
import { ShapeType } from '../types';

interface ControlsProps {
  currentShape: ShapeType;
  onShapeChange: (s: ShapeType) => void;
  color: string;
  onColorChange: (c: string) => void;
  trailLength: number;
  onTrailLengthChange: (l: number) => void;
  isConnected: boolean;
  onConnect: () => void;
  videoDevices: MediaDeviceInfo[];
  selectedDeviceId: string;
  onDeviceChange: (id: string) => void;
}

const SHAPES = Object.values(ShapeType);

export const Controls: React.FC<ControlsProps> = ({
  currentShape,
  onShapeChange,
  color,
  onColorChange,
  trailLength,
  onTrailLengthChange,
  isConnected,
  onConnect,
  videoDevices,
  selectedDeviceId,
  onDeviceChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between p-4 md:p-6 z-10">
      
      {/* Android Guide Modal */}
      {showAndroidGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto p-4">
            <div className="bg-gray-900 border border-cyan-500/30 rounded-2xl p-6 max-w-md w-full shadow-[0_0_50px_rgba(6,182,212,0.2)]">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-cyan-400">📱</span> Android to Windows Camera
                </h3>
                <div className="space-y-4 text-sm text-gray-300">
                    <p>Since browsers cannot directly access remote phones, you need a "Virtual Webcam" driver.</p>
                    <ol className="list-decimal pl-5 space-y-2">
                        <li>
                            <strong className="text-white">Install DroidCam</strong> (Free) on your Android phone from the Play Store.
                        </li>
                        <li>
                            <strong className="text-white">Install DroidCam Client</strong> on your Windows PC.
                        </li>
                        <li>
                            Connect both devices to the <strong>same WiFi</strong>.
                        </li>
                        <li>
                            Open the app on phone & PC. Enter the <strong>WiFi IP</strong> shown on phone into the PC client and click <strong>Start</strong>.
                        </li>
                    </ol>
                    <div className="bg-cyan-900/20 p-3 rounded border border-cyan-500/20 mt-4">
                        <p className="text-xs text-cyan-200">
                            ✅ Once started, close this modal and select <strong>"DroidCam Source"</strong> in the Camera Input list below.
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => setShowAndroidGuide(false)}
                    className="mt-6 w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded-lg transition-colors"
                >
                    Got it
                </button>
            </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div>
          <h1 className="text-3xl md:text-4xl font-light tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
            T<span className="font-bold text-cyan-400">PARTICLES</span>
          </h1>
          <p className="text-[10px] md:text-xs text-gray-400 mt-1 uppercase tracking-widest">
            Interactive 3D System
          </p>
        </div>

        <div className="flex gap-2">
          {!isConnected ? (
            <button
              onClick={onConnect}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 md:px-6 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-all shadow-[0_0_15px_rgba(6,182,212,0.5)] backdrop-blur-md"
            >
              ENABLE AI
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1 md:px-4 md:py-2 rounded-full border border-green-500/30">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] md:text-xs font-mono text-green-400">
                LIVE
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Controls Panel */}
      <div 
        className={`pointer-events-auto bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-sm self-end mb-4 md:mb-8 shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden flex flex-col ${isExpanded ? 'max-h-[80vh]' : 'max-h-[60px]'}`}
      >
        {/* Panel Header Toggle */}
        <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full p-4 flex justify-between items-center text-left hover:bg-white/5 transition-colors border-b border-white/0 hover:border-white/5 focus:outline-none"
        >
             <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <div className={`w-2 h-2 border-t-2 border-r-2 border-cyan-400 transform transition-transform duration-300 ${isExpanded ? 'rotate-135' : 'rotate-45'}`}></div>
                Settings
             </span>
             <span className="text-[10px] font-mono text-cyan-400 border border-cyan-400/30 px-2 py-0.5 rounded uppercase hover:bg-cyan-400/10 transition-colors">
                {isExpanded ? 'Hide' : 'Show'}
             </span>
        </button>

        {/* Scrollable Content */}
        <div className={`overflow-y-auto px-4 pb-4 md:px-6 md:pb-6 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
            
            {/* Camera Input Section */}
            <div className="mt-2 mb-4 border-b border-white/10 pb-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                    Camera Input
                </label>
                <div className="flex flex-col gap-2">
                    <select 
                        value={selectedDeviceId}
                        onChange={(e) => onDeviceChange(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-cyan-500/50"
                    >
                        {videoDevices.length === 0 && <option value="">Searching for cameras...</option>}
                        {videoDevices.map((device, idx) => (
                            <option key={device.deviceId} value={device.deviceId}>
                                {device.label || `Camera ${idx + 1} (Label hidden)`}
                            </option>
                        ))}
                    </select>
                    <button 
                        onClick={() => setShowAndroidGuide(true)}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors self-start"
                    >
                        <span>📲</span> Use Android Phone via WiFi
                    </button>
                </div>
            </div>

            {/* Shape Selector */}
            <div className="mb-4 border-b border-white/10 pb-4">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                Template
              </label>
              <div className="grid grid-cols-3 gap-2">
                {SHAPES.map((shape) => (
                  <button
                    key={shape}
                    onClick={() => onShapeChange(shape)}
                    className={`
                      py-2 px-3 rounded-lg text-xs font-medium transition-all duration-300
                      ${
                        currentShape === shape
                          ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                          : 'bg-white/5 text-gray-300 hover:bg-white/10'
                      }
                      `}
                  >
                    {shape}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Picker */}
            <div className="mb-4 border-b border-white/10 pb-4">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                Color Tone
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => onColorChange(e.target.value)}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full border-none cursor-pointer bg-transparent"
                />
                <span className="font-mono text-xs text-gray-400">
                  {color.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Trail Length */}
            <div className="mb-4 border-b border-white/10 pb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Trail Intensity
                </label>
                <span className="text-xs font-mono text-cyan-400">
                  {trailLength}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={trailLength}
                onChange={(e) => onTrailLengthChange(parseInt(e.target.value))}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300"
              />
            </div>

            {/* Instructions */}
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                Gesture Control
              </label>
              <p className="text-[10px] md:text-xs text-gray-400 leading-relaxed">
                <span className="text-cyan-400 font-bold">MODE:</span> Hands together to compress. Hands apart to expand.
              </p>
            </div>
        </div>
      </div>
    </div>
  );
};