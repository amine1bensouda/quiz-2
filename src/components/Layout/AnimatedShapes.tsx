'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimatedShapesProps {
  variant?: 'hero' | 'section' | 'floating' | 'gradient' | 'luxury';
  count?: number;
  intensity?: 'low' | 'medium' | 'high';
}

interface ShapeData {
  size: number;
  left: number;
  top: number;
  rotation: number;
  shapeType: number;
  delay: number;
  duration: number;
}

export default function AnimatedShapes({ 
  variant = 'hero', 
  count = 6,
  intensity = 'medium'
}: AnimatedShapesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shapesData, setShapesData] = useState<ShapeData[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const data: ShapeData[] = Array.from({ length: count }, (_, i) => ({
      size: 100 + Math.random() * 250,
      left: Math.random() * 100,
      top: Math.random() * 100,
      rotation: Math.random() * 360,
      shapeType: Math.floor(Math.random() * 5),
      delay: i * 0.2,
      duration: 25 + Math.random() * 20,
    }));
    setShapesData(data);
  }, [count]);

  const getShapeStyles = () => {
    switch (variant) {
      case 'hero':
        return 'opacity-30 blur-3xl';
      case 'section':
        return 'opacity-15 blur-2xl';
      case 'floating':
        return 'opacity-20 blur-xl';
      case 'gradient':
        return 'opacity-25 blur-2xl';
      case 'luxury':
        return 'opacity-20 blur-3xl';
      default:
        return 'opacity-15 blur-2xl';
    }
  };

  const getIntensityMultiplier = () => {
    switch (intensity) {
      case 'low':
        return 0.6;
      case 'medium':
        return 1;
      case 'high':
        return 1.4;
      default:
        return 1;
    }
  };

  if (!isMounted || shapesData.length === 0) {
    return (
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-hidden pointer-events-none"
        aria-hidden="true"
      />
    );
  }

  const shapes = shapesData.map((shapeData, i) => {
    const intensityMultiplier = getIntensityMultiplier();
    
    const shapeContent = () => {
      switch (shapeData.shapeType) {
        case 0: // Cercle avec gradient luxueux
          return (
            <div 
              className="w-full h-full rounded-full bg-gradient-to-br from-amber-400/40 via-orange-400/40 to-rose-400/40 animate-pulse-slow"
              style={{
                animationDuration: `${shapeData.duration}s`,
                animationDelay: `${shapeData.delay}s`,
              }}
            />
          );
        case 1: // Rectangle arrondi avec rotation
          return (
            <div 
              className="w-full h-full rounded-3xl bg-gradient-to-br from-indigo-400/40 via-purple-400/40 to-pink-400/40 animate-rotate-slow"
              style={{
                animationDuration: `${shapeData.duration}s`,
                animationDelay: `${shapeData.delay}s`,
              }}
            />
          );
        case 2: // Losange avec float
          return (
            <div 
              className="w-full h-full bg-gradient-to-br from-emerald-400/40 via-teal-400/40 to-cyan-400/40 transform rotate-45 animate-float"
              style={{
                animationDuration: `${shapeData.duration}s`,
                animationDelay: `${shapeData.delay}s`,
              }}
            />
          );
        case 3: // Forme organique
          return (
            <div 
              className="w-full h-full rounded-[40%] bg-gradient-to-br from-violet-400/40 via-fuchsia-400/40 to-rose-400/40 animate-pulse-slow"
              style={{
                animationDuration: `${shapeData.duration}s`,
                animationDelay: `${shapeData.delay}s`,
                borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
              }}
            />
          );
        case 4: // Forme hexagonale
          return (
            <div 
              className="w-full h-full bg-gradient-to-br from-blue-400/40 via-indigo-400/40 to-purple-400/40 animate-float"
              style={{
                animationDuration: `${shapeData.duration}s`,
                animationDelay: `${shapeData.delay}s`,
                clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
              }}
            />
          );
        default:
          return null;
      }
    };

    return (
      <div
        key={i}
        className={`absolute ${getShapeStyles()}`}
        style={{
          width: `${shapeData.size * intensityMultiplier}px`,
          height: `${shapeData.size * intensityMultiplier}px`,
          left: `${shapeData.left}%`,
          top: `${shapeData.top}%`,
          transform: `rotate(${shapeData.rotation}deg)`,
          willChange: 'transform, opacity',
        }}
      >
        {shapeContent()}
      </div>
    );
  });

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {shapes}
    </div>
  );
}




