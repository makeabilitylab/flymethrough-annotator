import React, { useRef, useEffect, useState } from 'react';
import {Layer, Stage} from 'react-konva';
import SAM2Encoder from '../SAM/encoder.tsx';
import SAM2Predictor from '../SAM/decoder.tsx';
import Annotation from '../Annotation.tsx';
import Point from '../Annotation.tsx';


const AnnotationPanel = ({ video, currentFrame, isProcessing,setIsProcessing,
    ongoingAnnotation,setOngoingAnnotation, encoder, predictor}) => {
  const imageCanvasRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const pointsCanvasRef = useRef(null);

  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [currentImage, setCurrentImage] = useState<HTMLImageElement | null>(null);
  const [currentMask, setCurrentMask] = useState<number[][] | null>(null);

  const drawCurrentFrame = () => {
    const canvas = imageCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Only set canvas dimensions once during initialization, not on every redraw
    // This prevents the canvas from growing taller each time
    // if (!canvas.width || !canvas.height) {
    //   const container = canvas.parentElement;
    //   if (!container) return;
    //   canvas.width = container.clientWidth;
    //   canvas.height = container.clientHeight;
    // }

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

    //if (!currentImage) {
      // Load new image if not cached
      const frame = video.getCompressedFrame(currentFrame);
      const img = new Image();
      img.crossOrigin = "anonymous"; // Add this line to handle CORS
      img.onload = async () => {
        console.log("Image loaded");
        setCurrentImage(img);
        drawImage(img, canvas, ctx);
      };
      img.src = frame;
    //} 
    // else {
    //   // Use cached image
    //   console.log("Using cached image");
    //   drawImage(currentImage, canvas, ctx);
    // }
  }

  const drawImage = (img, canvas, ctx) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
  }
  const drawCurrentAnnotation = () => {
    if (ongoingAnnotation == null)
        return;
    if (ongoingAnnotation.mask == null)
        return;
    const canvas = maskCanvasRef.current;
    const ctx = canvas.getContext('2d');
    drawMask(canvas, ongoingAnnotation.mask,currentImage.height, currentImage.width);
  }
  const drawCurrentFrameAnnotations = () => {
    const canvas = maskCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const annotations = video.getAnnotationsForFrame(currentFrame);
    for (const annotation of annotations) {
      drawMask(canvas, annotation.getMask(), currentImage.height, currentImage.width);
    }
  }
  const drawSAMResults = () => {
    //TODO: draw server annotation results as masks
  }
  const drawMask = (maskCanvas, maskData, imageWidth, imageHeight) => {
    console.log("Drawing mask", maskData);
    const maskCtx = maskCanvas.getContext('2d');
    const width = maskData.dims[3];
    const height = maskData.dims[2];

    // Convert the mask tensor data into image data
    const maskImageData = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < width * height; i++) {
        const value = maskData.data[i];
        const pixelIndex = i * 4;

        if (value > 0.0) {
            // Mark pixels inside the mask as semi-transparent red
            maskImageData[pixelIndex] = 255;     // R
            maskImageData[pixelIndex + 1] = 0;   // G
            maskImageData[pixelIndex + 2] = 0;   // B
            maskImageData[pixelIndex + 3] = 128; // A (transparency)
        } else {
            // Pixels outside the mask are transparent
            maskImageData[pixelIndex + 3] = 0;
        }
    }
    const imageData = new ImageData(maskImageData, width, height);
    
    // Use a temporary canvas to resize the mask
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.putImageData(imageData, 0, 0);

    // Calculate scale to match the image dimensions
    const scale = Math.min(
        maskCanvas.width / imageWidth,
        maskCanvas.height / imageHeight
    );
    const scaledWidth = imageWidth * scale;
    const scaledHeight = imageHeight * scale;
    
    // Center the mask
    const x = (maskCanvas.width - scaledWidth) / 2;
    const y = (maskCanvas.height - scaledHeight) / 2;

    // Clear previous mask and draw the new mask at the correct size and position
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    maskCtx.drawImage(tempCanvas, x, y, scaledWidth, scaledHeight);
};
const drawCurrentPoints = () => {
  const canvas = pointsCanvasRef.current;
  const ctx = canvas.getContext('2d');
  for (const point of currentPoints) {
    drawPoint(ctx, point);
  }
}
const drawPoint = (ctx, point) => {
  if (point.type == 1) {
    // Draw positive points
    ctx.fillStyle = 'rgba(112, 226, 19, 0.7)';
    ctx.strokeStyle = '#00FF00';
    ctx.beginPath();
    ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    // Draw + symbol
    ctx.strokeStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(point.x - 3, point.y);
    ctx.lineTo(point.x + 3, point.y);
    ctx.moveTo(point.x, point.y - 3);
        ctx.lineTo(point.x, point.y + 3);
        ctx.stroke();
  }
  else{
    ctx.fillStyle = 'rgba(189, 9, 9, 0.7)';
    ctx.strokeStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    // Draw - symbol
    ctx.strokeStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(point.x - 3, point.y);
    ctx.lineTo(point.x + 3, point.y);
    ctx.stroke();
  }
}
const clearCanvas = (canvas) => {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
const predict = async () => {
  const encoding = video.getEncoding(currentFrame);
  const mask = await predictor.predict(encoding, currentPoints, currentImage.height, currentImage.width);
  console.log("Mask: " + mask);
  setCurrentMask(mask['masks']);
  return mask;
}
  useEffect(() => {
    const canvas = imageCanvasRef.current;
    setCurrentPoints([]);
    if (!canvas) return;
    //if (!canvas.width || !canvas.height) {
        const container = canvas.parentElement;
        if (!container) return;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      //}
  },[]);

  useEffect(() => {
    //This part is for drawing the current frame. When select a new frame, draw it and also draw existing annotations.
    console.log("AnnotationPanel showing frame: " + currentFrame);
    if (!video || currentFrame === null) return;
    
    // Clear current image to force redraw
    console.log("Clearing current image");
    setCurrentImage(null);
    
    // Schedule the draw operations for the next frame
    requestAnimationFrame(() => {
      drawCurrentFrame();
      drawCurrentFrameAnnotations();
      drawSAMResults();
    });
  }, [currentFrame, video]);

  useEffect(() => {
    if (video == null)
        return;
    if (currentFrame == null)
        return;
    const canvas = imageCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (isProcessing) {
        // Wait for current frame to be drawn first
        requestAnimationFrame(() => {
            // Semi-transparent gray overlay
            ctx.fillStyle = 'rgba(128, 128, 128, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            // Add processing text
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            ctx.fillStyle = 'white';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Processing frame for segmentation...', centerX, centerY);
        });
    } else {
        // Clear any existing overlay
        requestAnimationFrame(() => {
            drawCurrentFrame();
            //drawCurrentFrameAnnotations(); 
            //drawSAMResults();
        });
    }
  }, [isProcessing]);

  useEffect(() => {
    //This part acts when current annotation changes.
    //When annotating, we draw the current points and mask.
    //When not annotating, we draw existing annotations.
    if (video == null)
        return;
    if (ongoingAnnotation != null) {
        setCurrentPoints(ongoingAnnotation.points);
        drawCurrentFrame();
        drawCurrentAnnotation();
        drawCurrentPoints();
    }
    else{
        drawCurrentFrame();
        //drawCurrentFrameAnnotations();
        //drawSAMResults();
    }
  }, [ongoingAnnotation]);

  useEffect(() => {
    if (video == null)
        return;
    //if (!canvasRef.current) return;
    if (currentPoints.length == 0) return;
    if (ongoingAnnotation == null) return;
    ongoingAnnotation.setPoints(currentPoints);
    const result = predict();
    const mask = result['masks']
    ongoingAnnotation.setMask(mask);
    // Use requestAnimationFrame to ensure drawing happens after state updates
    requestAnimationFrame(() => {
        // Redraw the current frame and existing annotations as base layer
        drawCurrentFrame();
        //drawCurrentFrameAnnotations();
        //drawSAMResults();
        //drawCurrentAnnotation();
        drawCurrentPoints();
    });
    
  }, [currentPoints]);

  useEffect(() => {
    if (video == null)
        return;
    if (ongoingAnnotation != null) {
        ongoingAnnotation.setMask(currentMask);
        //drawCurrentFrame();
        drawCurrentAnnotation();  
    }
  }, [currentMask]);
  



  const handleCanvasClick = async (e) => {
    const canvas = imageCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    console.log('Canvas clicked at:', x, y);
    if (video.getEncoding(currentFrame) == null) {
      console.log("No encoding found for frame " + currentFrame + " so we will encode it.");
      setIsProcessing(true);
      await processFrame(); // Wait for processing to complete
      setIsProcessing(false); // Remove overlay after processing
    }
    
    if (ongoingAnnotation != null) {
      //We have an encoding for this frame, so we can predict the mask.
      const newPoint = {x: x, y: y, type: 1};
      ongoingAnnotation.addPoint(newPoint);
      setCurrentPoints([...currentPoints, newPoint]);
      console.log("Adding a new point " + newPoint);
    }
  };
  const handleCanvasMouseMove = (e) => {
    //This function gets mouse position and tells if its within annotations.
    const canvas = imageCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    //console.log('Mouse position:', x, y);
  };

  const processFrame = async () => {
    if (currentFrame != null && currentImage != null) {
      const startTime = performance.now();
      const new_embedding = await encoder.encode(currentImage);
      const endTime = performance.now();
      console.log(`Frame processing took ${endTime - startTime}ms`);
      video.setEncoding(currentFrame, new_embedding);
    }
  };
  
  return (
    <div className="flex-1 bg-base-300 p-4 relative w-full h-full" style={{ minHeight: '400px' }}>
      <canvas
        ref={imageCanvasRef}
        
        className="w-full h-full cursor-pointer absolute top-0 left-0 z-10"
        style={{ width: '100%', height: '100%' }}
      />
      <canvas
        ref={maskCanvasRef}
        className="w-full h-full absolute top-0 left-0 z-10"
        style={{ width: '100%', height: '100%' }}
      />
      <canvas
        ref={pointsCanvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        className="w-full h-full absolute top-0 left-0 z-20"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default AnnotationPanel;
