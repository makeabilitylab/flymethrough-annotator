import React, { useRef, useEffect } from 'react';
import SAM2Encoder from '../SAM/encoder.tsx';
import SAM2Predictor from '../SAM/decoder.tsx';

const AnnotationPanel = ({ video, currentFrame, isProcessing}) => {
  const canvasRef = useRef(null);
  var encoder: SAM2Encoder | null = null;
  var predictor: SAM2Predictor | null = null;
  
  useEffect(() => {
    console.log("AnnotationPanel showing frame: " + currentFrame);
    if (!video) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas size to fill container while maintaining aspect ratio
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    canvas.width = containerWidth;
    canvas.height = containerHeight;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (currentFrame === null) {
      // Show instruction text when no frame is selected
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Click any frame to start annotating', canvas.width/2, canvas.height/2);
      return;
    }

    // Draw current frame if available
    if (video && currentFrame >= 0) {
      console.log("Drawing frame: " + currentFrame);
      const frame = video.getRawFrame(currentFrame);
      if (frame) {
        const img = new Image();
        img.onload = () => {
          // Clear previous frame
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Calculate dimensions to maintain aspect ratio and fit container
          const scale = Math.min(
            canvas.width / img.width,
            canvas.height / img.height
          );
          const width = img.width * scale;
          const height = img.height * scale;
          
          // Center the image
          const x = (canvas.width - width) / 2;
          const y = (canvas.height - height) / 2;
          
          // Draw the image
          ctx.drawImage(img, x, y, width, height);

          // Add processing overlay if needed
          if (isProcessing) {
            // Semi-transparent gray overlay
            ctx.fillStyle = 'rgba(128, 128, 128, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Loading spinner effect
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = 30;
            const startAngle = performance.now() / 1000;
            
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, startAngle, startAngle + Math.PI * 1.5);
            ctx.stroke();

            // Request animation frame for spinner animation
            if (isProcessing) {
              // Add processing text
              ctx.fillStyle = 'white';
              ctx.font = '16px Arial';
              ctx.textAlign = 'center';
              ctx.fillText('Processing frame for segmentation...', centerX, centerY + radius + 20);

              requestAnimationFrame(() => {
                // Trigger re-render for animation
                canvas.style.opacity = canvas.style.opacity === '0.99' ? '1' : '0.99';
              });
            }
          }
        };
        img.src = frame;
      }
    }
  }, [currentFrame, isProcessing]);

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    console.log('Canvas clicked at:', x, y);
  };

  return (
    <div className="flex-1 bg-base-300 p-4">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-pointer"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
};

export default AnnotationPanel;
