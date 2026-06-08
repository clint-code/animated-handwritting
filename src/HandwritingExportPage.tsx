import React, { useState, useRef } from 'react';
import HandwritingComponent from './components/HandwrittingComponent';

export const HandwritingExportPage: React.FC = () => {
  const [text, setText] = useState('Enter your text');
  const [isExporting, setIsExporting] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const exportToVideo = async () => {
    if (!svgRef.current) return;

    setIsExporting(true);

    try {
      // Create canvas for video recording
      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set up canvas recording
      const stream = canvas.captureStream(30); // 30 FPS
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `handwriting-${Date.now()}.webm`;
        link.click();
        URL.revokeObjectURL(url);
        setIsExporting(false);
      };

      mediaRecorder.start();

      // Draw animation frames to canvas
      let frameCount = 0;
      const totalFrames = 2.5 * 30; // 2.5 second animation at 30 FPS

      const drawFrame = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw text
        ctx.font = 'bold 120px cursive';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // Calculate progress for animation
        const progress = frameCount / totalFrames;

        // Animate stroke by drawing incrementally
        // This simulates the DrawSVG effect on canvas
        ctx.strokeText(text, 960, 540);

        frameCount++;

        if (frameCount < totalFrames) {
          requestAnimationFrame(drawFrame);
        } else {
          mediaRecorder.stop();
        }
      };

      drawFrame();
    } catch (error) {
      console.error('Export error:', error);
      setIsExporting(false);
    }
  };
  

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Handwriting Animation Exporter (DrawSVG)</h1>

      {/* Input */}
      <div style={{ marginBottom: '2rem' }}>
        <label
          htmlFor="text-input"
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: 'bold',
          }}
        >
          Enter Text:
        </label>
        <input
          id="text-input"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type something..."
          style={{
            width: '100%',
            maxWidth: '500px',
            padding: '12px',
            fontSize: '16px',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
        />
      </div>

      {/* Preview */}
      <div
        style={{
          marginBottom: '2rem',
          border: '1px solid #ddd',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: '#fff',
        }}
      >
        <HandwritingComponent text={text} duration={4} />
      </div>

      {/* Export Button */}
      <button
        onClick={exportToVideo}
        disabled={isExporting}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: isExporting ? '#ccc' : '#000',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: isExporting ? 'not-allowed' : 'pointer',
        }}
      >
        {isExporting ? 'Exporting...' : 'Export as WebM Video'}
      </button>
    </div>
  );
};

export default HandwritingExportPage;
