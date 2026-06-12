import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';

interface HandwritingProps {
  text: string;
  duration?: number;
}

export const HandwritingAnimation: React.FC<HandwritingProps> = ({
  text = 'Your text here',
  duration = 3,
}) => {
  const textRef = useRef<SVGTextElement>(null);

  useEffect(() => {
    if (!textRef.current) {
      console.log('Text ref not ready');
      return;
    }

    // Update text
    textRef.current.textContent = text;
    console.log('Text updated to:', text);

    // Wait for SVG to render
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!textRef.current) return;

        try {
          // Get path length
          const pathLength = (textRef.current as any).getTotalLength?.() || 1000;
          console.log('Path length:', pathLength);

          // Kill any existing animations
          gsap.killTweensOf(textRef.current);

          // Set initial state - text invisible
          textRef.current.style.strokeDasharray = pathLength.toString();
          textRef.current.style.strokeDashoffset = pathLength.toString();

          // Animate - reveal text
          gsap.to(textRef.current, {
            strokeDashoffset: 0,
            duration,
            ease: 'sine.inOut',
            onStart: () => console.log('Animation started'),
            onComplete: () => console.log('Animation complete'),
          });
        } catch (error) {
          console.error('Animation error:', error);
        }
      });
    });
  }, [text, duration]);

  return (
    <svg
      viewBox="0 0 1920 1080"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        width: '100%',
        height: 'auto',
        display: 'block',
        backgroundColor: '#fff',
        border: '2px solid #ccc',
      }}
    >
      <text
        ref={textRef}
        x="960"
        y="540"
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          fontSize: '200px',
          fontFamily: '"Tangerine", cursive',
          fill: 'none',
          stroke: '#000000',
          strokeWidth: '7.5',
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