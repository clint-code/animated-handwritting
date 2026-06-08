import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import DrawSVGPlugin from 'gsap/DrawSVGPlugin';

// Register the DrawSVG plugin
gsap.registerPlugin(DrawSVGPlugin);

interface HandwritingAnimationProps {
  text: string;
  duration?: number;
}

export const HandwritingComponent: React.FC<HandwritingAnimationProps> = ({
  text,
  duration = 2.5,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const textRef = useRef<SVGTextElement>(null);
  const timelineRef = useRef<gsap.core.Tween | null>(null);
  const pathLength = (textRef.current as any).getTotalLength?.() || 1000;

  useEffect(() => {
    if (!textRef.current) return;

    // Update text content
    textRef.current.textContent = text;

    // Kill previous timeline
    if (timelineRef.current) {
      timelineRef.current.kill();
    }

    // Initial state - invisible
    textRef.current.style.strokeDasharray = pathLength;
    textRef.current.style.strokeDashoffset = pathLength;

    // Create animation with DrawSVG
    gsap.to(textRef.current, {
      strokeDashoffset: 0,
      duration,
      ease: 'sine.inOut',
    });
  }, [text, duration]);

  const replay = () => {
    // Initial state - invisible
    textRef.current.style.strokeDasharray = pathLength;
    textRef.current.style.strokeDashoffset = pathLength;

    // Create animation with DrawSVG
    gsap.to(textRef.current, {
      strokeDashoffset: 0,
      duration,
      ease: 'sine.inOut',
    });
  };

  return (
    <>
      <svg
        ref={svgRef}
        viewBox="0 0 1920 1080"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
        }}
      >
        <text
          ref={textRef}
          x="960"
          y="540"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontSize: '300px',
            fontFamily: '"Italianno", cursive',
            //fill: 'none',
            stroke: '#000000',
            strokeWidth: '5',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
          }}
        >
          {text}
        </text>
      </svg>

      <button onClick={replay}>Replay Animation</button>
    </>
  );
};

export default HandwritingComponent;
