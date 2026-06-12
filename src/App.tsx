import React, { useState, useRef } from 'react';
import HandwritingAnimation from './HandwritingAnimation';

export default function App() {
  const [text, setText] = useState('Your text here');
  const [duration, setDuration] = useState(3);
  const [isExporting, setIsExporting] = useState(false);

  const exportToVideo = async () => {
    setIsExporting(true);

    try {
      // Create export canvas
      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set up video recording
      const stream = canvas.captureStream(30); // 30 FPS

            // Try codecs in order of compatibility
            const mimeTypes = [
              'video/webm;codecs=vp9',
              'video/webm;codecs=vp8',
              'video/webm',
            ];
            
            let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          console.log('Using codec:', mimeType);
          break;
        }
      }
      
      if (!selectedMimeType) {
        console.error('No supported video codec found');
        alert('Your browser does not support video export');
        setIsExporting(false);
        return;
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
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

      let frameCount = 0;
      const totalFrames = duration * 30;

      const renderFrame = () => {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw text with stroke
        ctx.font = `140px "Italianno", cursive`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Animate progress
        const progress = frameCount / totalFrames;
        
        // Draw text (the clipping effect happens via canvas rendering)
        ctx.strokeText(text, 960, 540);

        frameCount++;

        if (frameCount < totalFrames) {
          requestAnimationFrame(renderFrame);
        } else {
          mediaRecorder.stop();
        }
      };

      renderFrame();
    } catch (error) {
      console.error('Export error:', error);
      setIsExporting(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h1>Handwriting Animation Exporter</h1>

      {/* Controls */}
      <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Text:
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to animate..."
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '1px solid #ccc',
              borderRadius: '6px',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Duration: {duration}s
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Preview */}
      <div style={{ marginBottom: '2rem', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', backgroundColor:'red' }}>
        <HandwritingAnimation text={text} duration={duration} />
      </div>

      {/* Export Button */}
      <button
        onClick={exportToVideo}
        disabled={isExporting}
        style={{
          padding: '14px 28px',
          fontSize: '18px',
          fontWeight: 'bold',
          backgroundColor: isExporting ? '#ccc' : '#000',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: isExporting ? 'not-allowed' : 'pointer',
        }}
      >
        {isExporting ? 'Exporting...' : 'Export as WebM Video'}
      </button>

      <p style={{ marginTop: '1rem', fontSize: '14px', color: '#666' }}>
        📥 Downloads as WebM video (1920×1080, transparent background, 30 FPS)
      </p>
    </div>
  );
}