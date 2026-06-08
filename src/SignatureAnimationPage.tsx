import React, { useRef, useState } from 'react';
//import gsap from 'gsap';

export const SignatureAnimation: React.FC = () => {
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const animateCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawCanvasRef.current) return;
    setIsDrawing(true);
    const rect = drawCanvasRef.current.getBoundingClientRect();
    const ctx = drawCanvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawCanvasRef.current) return;
    const rect = drawCanvasRef.current.getBoundingClientRect();
    const ctx = drawCanvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setHasSignature(true);
  };

  const clearSignature = () => {
    if (!drawCanvasRef.current) return;
    const ctx = drawCanvasRef.current.getContext('2d');
    if (ctx) {
      ctx.clearRect(
        0,
        0,
        drawCanvasRef.current.width,
        drawCanvasRef.current.height
      );
    }
    setHasSignature(false);
  };

  const animateSignature = () => {
    if (!animateCanvasRef.current || !drawCanvasRef.current) return;

    const animCtx = animateCanvasRef.current.getContext('2d');
    const srcCanvas = drawCanvasRef.current;

    if (!animCtx) return;

    // Set up animation
    let progress = 0;
    const duration = 2.5;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      progress = Math.min(elapsed / duration, 1);

      // Clear canvas
      animCtx.clearRect(
        0,
        0,
        animateCanvasRef.current!.width,
        animateCanvasRef.current!.height
      );

      // Draw partial signature using globalAlpha trick
      animCtx.globalAlpha = 1;
      animCtx.drawImage(srcCanvas, 0, 0);

      // Use a clipping region to show only the animated portion
      animCtx.save();
      animCtx.beginPath();
      animCtx.rect(0, 0, srcCanvas.width * progress, srcCanvas.height);
      animCtx.clip();
      animCtx.drawImage(srcCanvas, 0, 0);
      animCtx.restore();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  };

  const exportToVideo = async () => {
    if (!drawCanvasRef.current) return;

    setIsExporting(true);

    // Create export canvas at higher resolution
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 1920;
    exportCanvas.height = 1080;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    const stream = exportCanvas.captureStream(30);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
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
      link.download = `signature-${Date.now()}.webm`;
      link.click();
      URL.revokeObjectURL(url);
      setIsExporting(false);
    };

    mediaRecorder.start();

    let frameCount = 0;
    const totalFrames = 2.5 * 30;

    const recordFrame = () => {
      const progress = frameCount / totalFrames;

      // Clear
      ctx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);

      // Scale and draw signature with progress
      ctx.save();
      ctx.scale(
        1920 / drawCanvasRef.current!.width,
        1080 / drawCanvasRef.current!.height
      );

      // Clip to show only up to current progress
      ctx.beginPath();
      ctx.rect(
        0,
        0,
        drawCanvasRef.current!.width * progress,
        drawCanvasRef.current!.height
      );
      ctx.clip();

      ctx.drawImage(drawCanvasRef.current!, 0, 0);
      ctx.restore();

      frameCount++;

      if (frameCount < totalFrames) {
        requestAnimationFrame(recordFrame);
      } else {
        mediaRecorder.stop();
      }
    };

    recordFrame();
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Signature Animation Exporter</h1>

      <div style={{ marginBottom: '3rem' }}>
        <h2>Draw Your Signature</h2>
        <p style={{ color: '#666', marginBottom: '1rem' }}>
          Click and drag to draw your signature
        </p>

        <canvas
          ref={drawCanvasRef}
          width={800}
          height={400}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          style={{
            border: '2px solid #333',
            borderRadius: '8px',
            cursor: 'crosshair',
            display: 'block',
            backgroundColor: '#fff',
            marginBottom: '1rem',
            touchAction: 'none',
          }}
        />

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={clearSignature}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              backgroundColor: '#999',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Clear
          </button>

          {hasSignature && (
            <>
              <button
                onClick={animateSignature}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  backgroundColor: '#333',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Preview Animation
              </button>

              <button
                onClick={exportToVideo}
                disabled={isExporting}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  backgroundColor: isExporting ? '#ccc' : '#000',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isExporting ? 'not-allowed' : 'pointer',
                }}
              >
                {isExporting ? 'Exporting...' : 'Export as Video'}
              </button>
            </>
          )}
        </div>
      </div>

      <div>
        <h2>Animation Preview</h2>
        <p style={{ color: '#666', marginBottom: '1rem' }}>
          Click "Preview Animation" to see how it will look
        </p>
        <canvas
          ref={animateCanvasRef}
          width={800}
          height={400}
          style={{
            width: '100%',
            height: 'auto',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: '#fff',
            display: 'block',
          }}
        />
      </div>
    </div>
  );
};

export default SignatureAnimation;
