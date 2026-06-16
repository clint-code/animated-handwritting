import React, { useState } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import HandwritingAnimation from './HandwritingAnimation';

const ffmpeg = new FFmpeg();

export default function App() {
  const [text, setText] = useState('Your text here');
  const [duration, setDuration] = useState(3);
  const [isExporting, setIsExporting] = useState(false);
  const [ffmpegReady, setFfmpegReady] = useState(false);

  const FONT_SIZE = 220; // matches fontSize: '220px'
  const STROKE_WIDTH = 7.5; // matches strokeWidth: '7.5'
  const FONT_FAMILY = '"Tangerine", cursive'; // matches fontFamily
  const STROKE_COLOR = '#ffffff'; // matches stroke: '#ffffff'

  // Initialize FFmpeg once
  React.useEffect(() => {
    const initFFmpeg = async () => {
      try {
        const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm';
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        setFfmpegReady(true);
        console.log('FFmpeg ready');
      } catch (error) {
        console.error('FFmpeg initialization error:', error);
      }
    };
    initFFmpeg();
  }, []);

  const exportToVideo = async () => {
    
    setIsExporting(true);

    try {
      // Create export canvas
      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

            // Wait for fonts to be ready
            await new Promise(resolve => {
              if ((document as any).fonts?.ready) {
                (document as any).fonts.ready.then(() => resolve(null));
              } else {
                setTimeout(() => resolve(null), 500);
              }
            });      

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

      // When recording finishes, convert WebM to MP4
      mediaRecorder.onstop = async () => {
        const webmBlob = new Blob(chunks, { type: selectedMimeType });
        
        // Convert to MP4 if FFmpeg is ready
        if (ffmpegReady) {
          await convertToMP4(webmBlob);
        } else {
          // Fallback: download as WebM
          console.warn('FFmpeg not ready, downloading as WebM');
          downloadWebM(webmBlob);
        }
        
        setIsExporting(false);
      };

      mediaRecorder.start();

      let frameCount = 0;
      const totalFrames = duration * 30;

      const renderFrame = () => {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate progress (0 to 1)
        const progress = frameCount / totalFrames;

        // Draw text with stroke
        ctx.font = `700 ${FONT_SIZE}px ${FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = STROKE_COLOR;
        ctx.lineWidth = STROKE_WIDTH;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Clip canvas to show text progressively
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, canvas.width * progress, canvas.height);  // Clip from 0% to 100%
        ctx.clip();

        // Draw text (only visible within clipped region)
        ctx.strokeText(text, 960, 540);

        ctx.restore();

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

  const convertToMP4 = async (webmBlob: Blob) => {
    try {
      console.log('Converting WebM to MP4...');
      
      // Write WebM to FFmpeg virtual file system
      const webmData = await webmBlob.arrayBuffer();
      ffmpeg.writeFile('input.webm', new Uint8Array(webmData));

      // Run FFmpeg to convert WebM to MP4
      await ffmpeg.exec([
        '-i', 'input.webm',
        '-c:v', 'libx264',  // Video codec
        '-preset', 'fast',   // Speed/quality tradeoff
        '-c:a', 'aac',       // Audio codec
        'output.mp4'
      ]);

      // Read the output MP4
      const data = await ffmpeg.readFile('output.mp4');
      const mp4Blob = new Blob([data], { type: 'video/mp4' });

      // Download MP4
      const url = URL.createObjectURL(mp4Blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `handwriting-${Date.now()}.mp4`;
      link.click();
      URL.revokeObjectURL(url);

      // Clean up FFmpeg files
      await ffmpeg.deleteFile('input.webm');
      await ffmpeg.deleteFile('output.mp4');

      console.log('MP4 conversion complete');
    } catch (error) {
      console.error('MP4 conversion error:', error);
      alert('MP4 conversion failed, downloading as WebM instead');
      // The WebM is already recorded, but we couldn't convert it
    }
  };

  const downloadWebM = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `handwriting-${Date.now()}.webm`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h1>Handwriting Animation Exporter</h1>

      {/* FFmpeg Status */}
      <div style={{ 
        padding: '12px', 
        marginBottom: '1rem', 
        borderRadius: '6px',
        backgroundColor: ffmpegReady ? '#d1fae5' : '#fef3c7',
        color: ffmpegReady ? '#047857' : '#92400e',
      }}>
        FFmpeg: {ffmpegReady ? '✅ Ready (MP4 export enabled)' : '⏳ Loading...'}
      </div>

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
      <div style={{ marginBottom: '2rem', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
        <HandwritingAnimation text={text} duration={duration} />
      </div>

      {/* Export Button */}
      <button
        onClick={exportToVideo}
        disabled={isExporting || !ffmpegReady}
        style={{
          padding: '14px 28px',
          fontSize: '18px',
          fontWeight: 'bold',
          backgroundColor: (isExporting || !ffmpegReady) ? '#ccc' : '#000',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: (isExporting || !ffmpegReady) ? 'not-allowed' : 'pointer',
        }}
      >
        {isExporting ? 'Exporting & Converting...' : 'Export as MP4 Video'}
      </button>

      <p style={{ marginTop: '1rem', fontSize: '14px', color: '#666' }}>
        📥 Downloads as MP4 video (1920×1080, transparent background, 30 FPS)
      </p>
    </div>
  );
}