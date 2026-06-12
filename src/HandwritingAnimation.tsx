import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import DrawSVGPlugin from 'gsap/DrawSVGPlugin';

// Register DrawSVG if available
try {
  gsap.registerPlugin(DrawSVGPlugin);
} catch (e) {
  console.warn('DrawSVG not available, using fallback animation');
}

interface HandwritingProps {
  text: string;
  duration?: number;
}

/**
 * Handwriting animation component
 * Uses DrawSVG for smooth stroke animation
 */
export const HandwritingAnimation: React.FC<HandwritingProps> = ({
  text = 'Your text here',
  duration = 3,
}) => {
  
  const svgRef = useRef<SVGSVGElement>(null);
  const textRef = useRef<SVGTextElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (!textRef.current) return;

    // Update text
    textRef.current.textContent = text;

    // Delay to ensure SVG is rendered
    const timer = setTimeout(() => {
      if (!textRef.current) return;

      // Kill existing animation
      if (timelineRef.current) {
        timelineRef.current.kill();
      }

      // Create timeline
      timelineRef.current = gsap.timeline();

      // Try DrawSVG first, fallback to stroke-dasharray
      try {
        timelineRef.current.to(textRef.current, {
          drawSVG: '0% 100%',
          duration,
          ease: 'sine.inOut',
        });
      } catch (e) {
        // Fallback: stroke-dasharray animation
        const pathLength = (textRef.current as any).getTotalLength?.() || 1000;
        
        textRef.current.style.strokeDasharray = pathLength.toString();
        textRef.current.style.strokeDashoffset = pathLength.toString();

        timelineRef.current.to(textRef.current, {
          strokeDashoffset: 0,
          duration,
          ease: 'sine.inOut',
        });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [text, duration]);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 1920 1080"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        width: '100%',
        height: 'auto',
        display: 'block',
        backgroundColor: '#fff',
      }}
    >
      <text
        ref={textRef}
        x="960"
        y="540"
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          fontSize: '140px',
          fontFamily: '"Italianno", cursive',
          fill: 'none',
          stroke: '#000000',
          strokeWidth: '5.5',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }}
      >
        {text}
      </text>
    </svg>
  );
};

export default HandwritingAnimation;