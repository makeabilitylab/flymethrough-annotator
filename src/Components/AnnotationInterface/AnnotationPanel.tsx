import React, { useRef, useEffect, useState, useImperativeHandle } from 'react';
import {Layer, Stage} from 'react-konva';
import SAM2Encoder from '../SAM/encoder.tsx';
import SAM2Predictor from '../SAM/decoder.tsx';
//import Annotation from '../Annotation.tsx';
import Point from '../Annotation.tsx';


const AnnotationPanel = React.forwardRef(({ video, currentFrame, isProcessing, setIsProcessing,
    ongoingAnnotation, setOngoingAnnotation, viewingAnnotation, setViewingAnnotation, encoder, predictor}, ref) => {
  const imageCanvasRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const pointsCanvasRef = useRef(null);
  const bboxCanvasRef = useRef(null);

  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [currentImage, setCurrentImage] = useState<HTMLImageElement | null>(null);
  const [currentImageWidth, setCurrentImageWidth] = useState<number>(0);
  const [currentImageHeight, setCurrentImageHeight] = useState<number>(0);
  const [currentMask, setCurrentMask] = useState<number[][] | null>(null);

  useImperativeHandle(ref, () => ({
    clearPoints: clearPoints
  }));

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
        setCurrentImageWidth(img.width);
        setCurrentImageHeight(img.height);
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
  const drawAnnotation = (annotation) => {
    if (annotation == null)
        return;
    if (annotation.mask == null)
        return;
    const canvas = maskCanvasRef.current;
    const ctx = canvas.getContext('2d');
    drawMask(canvas, annotation.mask,annotation.color);
  }
//   const drawCurrentFrameAnnotations = () => {
//     const canvas = maskCanvasRef.current;
//     const ctx = canvas.getContext('2d');
//     const annotations = video.getAnnotationsForFrame(currentFrame);
//     for (const annotation of annotations) {
//       drawMask(canvas, annotation.getMask(), currentImage.height, currentImage.width);
//     }
//   }
  const drawSAMResults = () => {
    //TODO: draw server annotation results as masks
    const bboxes=video.getSAMResultsByFrame(currentFrame);
    console.log("When drawing SAM results, got Bboxes: " + bboxes);
    const canvas = bboxCanvasRef.current;
    const ctx = canvas.getContext('2d');
    for (const bbox of bboxes) {
      drawBBox(bbox.bbox, bbox.annotation.color, bbox.annotation);
    }
  }
  const drawMask = (maskCanvas, maskData, color) => {
    console.log("Drawing mask", maskData);
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return;
    
    const width = maskData.dims[3];
    const height = maskData.dims[2];

    // Convert the mask tensor data into image data with more visible pixels
    const maskImageData = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < width * height; i++) {
        const value = maskData.data[i];
        const pixelIndex = i * 4;

        if (value > 0.0) {
            // Make mask pixels more visible with brighter red and higher opacity
            // Parse the color string (hex format like '#FF5733')
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            
            maskImageData[pixelIndex] = r;       // R - from annotation color
            maskImageData[pixelIndex + 1] = g;   // G - from annotation color
            maskImageData[pixelIndex + 2] = b;   // B - from annotation color
            maskImageData[pixelIndex + 3] = 180; // A - semi-transparent
        } else {
            // Keep pixels outside the mask fully transparent
            maskImageData[pixelIndex + 3] = 0;
        }
    }
    const imageData = new ImageData(maskImageData, width, height);
    
    // Create temporary canvas for proper scaling
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    tempCtx.putImageData(imageData, 0, 0);

    // Calculate scale to exactly match the image dimensions
    const scale = Math.min(
        maskCanvas.width / currentImageWidth,
        maskCanvas.height / currentImageHeight
    );
    const scaledWidth = currentImageWidth * scale;
    const scaledHeight = currentImageHeight * scale;
    
    // Center the mask precisely
    const x = Math.floor((maskCanvas.width - scaledWidth) / 2);
    const y = Math.floor((maskCanvas.height - scaledHeight) / 2);

    // Clear previous mask
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    
    // Use better image scaling quality and draw the mask
    maskCtx.imageSmoothingEnabled = true;
    maskCtx.imageSmoothingQuality = 'high';
    maskCtx.drawImage(tempCanvas, x, y, scaledWidth, scaledHeight);
};

const drawBBox = (bbox, color, annotation) => {
  // Convert normalized 0-1 coordinates to canvas coordinates
  if (!bboxCanvasRef.current || !currentImage) return;
  
  const canvasWidth = bboxCanvasRef.current.width;
  const canvasHeight = bboxCanvasRef.current.height;
  //console.log("Canvas width: " + canvasWidth);
  const ctx = bboxCanvasRef.current.getContext('2d');
  if (!ctx) return;

  // Calculate scale to fit image in canvas while maintaining aspect ratio
  const scale = Math.min(
    canvasWidth / currentImage.width,
    canvasHeight / currentImage.height
  );
  //console.log("Scale: " + scale);
  // Calculate scaled image dimensions
  const scaledWidth = currentImage.width * scale;
  const scaledHeight = currentImage.height * scale;

  // Calculate offsets to center image in canvas
  const offsetX = (canvasWidth - scaledWidth) / 2;
  const offsetY = (canvasHeight - scaledHeight) / 2;
  console.log("Offset: " + offsetX + " " + offsetY);
  const x1 = (bbox[0] * scaledWidth) + offsetX;
  const y1 = (bbox[1] * scaledHeight) + offsetY;
  const x2 = (bbox[2] * scaledWidth) + offsetX;
  const y2 = (bbox[3] * scaledHeight) + offsetY;
  
  ctx.beginPath();
  ctx.lineWidth = 3;
  ctx.strokeStyle = color;
  ctx.rect(x1, y1, x2 - x1, y2 - y1);
  ctx.stroke();
  // Add a semi-transparent fill to make it more visible
  ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
  ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
  
  // Write the annotation ID in the middle of the bbox
  if (annotation && annotation.getId()) {
    const centerX = x1 + (x2 - x1) / 2;
    const centerY = y1 + (y2 - y1) / 2;
    
    ctx.font = '14px Arial';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw text outline for better visibility
    ctx.strokeText(annotation.getId(), centerX, centerY);
    // Draw the text
    ctx.fillText(annotation.getId(), centerX, centerY);
  }
  
  console.log("Drawing bbox: " + x1 + " " + y1 + " " + x2 + " " + y2);
}

const drawCurrentPoints = () => {
  const canvas = pointsCanvasRef.current;
  const ctx = canvas.getContext('2d');
  for (const point of currentPoints) {
    drawPoint(ctx, point);
  }
}
const drawPoint = (ctx, point) => {
  if (!pointsCanvasRef.current || !currentImage) return;
  const canvas = pointsCanvasRef.current;

  // Calculate scale to fit image in canvas while maintaining aspect ratio
  const scale = Math.min(
    canvas.width / currentImageWidth,
    canvas.height / currentImageHeight
  );

  // Calculate scaled image dimensions
  const scaledWidth = currentImageWidth * scale;
  const scaledHeight = currentImageHeight * scale;

  // Calculate offsets to center image in canvas
  const offsetX = (canvas.width - scaledWidth) / 2;
  const offsetY = (canvas.height - scaledHeight) / 2;
  console.log("Offset: " + offsetX + " " + offsetY);

  // Convert normalized 0-1 coordinates to actual canvas coordinates
  const canvasX = offsetX + (point.x * currentImageWidth * scale);
  const canvasY = offsetY + (point.y * currentImageHeight * scale);

  if (point.type == 1) {
    // Draw positive points
    ctx.fillStyle = 'rgba(112, 226, 19, 0.7)';
    ctx.strokeStyle = '#00FF00';
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    // Draw + symbol
    ctx.strokeStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(canvasX - 3, canvasY);
    ctx.lineTo(canvasX + 3, canvasY);
    ctx.moveTo(canvasX, canvasY - 3);
    ctx.lineTo(canvasX, canvasY + 3);
    ctx.stroke();
  }
  else {
    ctx.fillStyle = 'rgba(189, 9, 9, 0.7)';
    ctx.strokeStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    // Draw - symbol
    ctx.strokeStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(canvasX - 3, canvasY);
    ctx.lineTo(canvasX + 3, canvasY);
    ctx.stroke();
  }
}
const clearCanvas = (canvas) => {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
const predict = async () => {
  const encoding = video.getEncoding(currentFrame);
  // Scale points according to decoder's requirements
  const scaleFactor = predictor.getPointScaleFactor(currentImageHeight, currentImageWidth);
  const scaledPoints = currentPoints.map(point => ({
    ...point,
    x: point.x * scaleFactor.x,
    y: point.y * scaleFactor.y
  }));
  const mask = await predictor.predict(encoding, scaledPoints, currentImageHeight, currentImageWidth);
  console.log("Mask: " + mask);
  setCurrentMask(mask['masks']);
  return mask;
}
  useEffect(() => {
    const canvas = imageCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const pointsCanvas = pointsCanvasRef.current;
    const bboxCanvas = bboxCanvasRef.current;
    setCurrentPoints([]);
    if (!canvas) return;
    //if (!canvas.width || !canvas.height) {
        const container = canvas.parentElement;
        if (!container) return;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        
        // Ensure all canvases have the same dimensions
        if (maskCanvas) {
          maskCanvas.width = container.clientWidth;
          maskCanvas.height = container.clientHeight;
        }
        if (pointsCanvas) {
          pointsCanvas.width = container.clientWidth;
          pointsCanvas.height = container.clientHeight;
        }
        if (bboxCanvas) {
          bboxCanvas.width = container.clientWidth;
          bboxCanvas.height = container.clientHeight;
        }
      //}
      const resizeCanvas = (canvas) => {
        const container = canvas.parentElement;
        if (!container) return;
  
        // Store the current content
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        tempCtx.drawImage(canvas, 0, 0);
  
        // Resize canvas
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
  
        // Restore content
        const ctx = canvas.getContext('2d');
        ctx.drawImage(tempCanvas, 0, 0);
      };
      resizeCanvas(canvas);
      resizeCanvas(maskCanvas);
      resizeCanvas(pointsCanvas);
      resizeCanvas(bboxCanvas);
  },[]);

  useEffect(() => {
    const canvas = imageCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const pointsCanvas = pointsCanvasRef.current;
    const bboxCanvas = bboxCanvasRef.current;
    
    if (!canvas || !maskCanvas || !pointsCanvas || !bboxCanvas) return;

    // Function to resize canvas while maintaining content
    const resizeCanvas = (canvas) => {
      const container = canvas.parentElement;
      if (!container) return;

      // Store the current content
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      tempCtx.drawImage(canvas, 0, 0);

      // Resize canvas
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;

      // Restore content
      const ctx = canvas.getContext('2d');
      ctx.drawImage(tempCanvas, 0, 0);
    };

    // Handle window resize
    const handleResize = () => {
      resizeCanvas(canvas);
      resizeCanvas(maskCanvas);
      resizeCanvas(pointsCanvas);
      resizeCanvas(bboxCanvas);
      
      // Redraw everything
      drawCurrentFrame();
      drawAnnotation(ongoingAnnotation);
      //drawSAMResults();
      //drawCurrentFrameAnnotations();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const clearPoints = () => {
    setCurrentPoints([]);
  }

  useEffect(() => {
    //This part is for drawing the current frame. When select a new frame, draw it and also draw existing annotations.
    console.log("AnnotationPanel showing frame: " + currentFrame);
    if (!video || currentFrame === null) return;
    
    // Clear current image to force redraw
    console.log("Clearing current image");
    setCurrentImage(null);
    setCurrentMask(null);
    setCurrentPoints([]);
    setOngoingAnnotation(null);
    // Schedule the draw operations for the next frame
    requestAnimationFrame(() => {
      //clearCanvas(imageCanvasRef.current);
      clearCanvas(maskCanvasRef.current);
      clearCanvas(pointsCanvasRef.current);
      clearCanvas(bboxCanvasRef.current);
      drawCurrentFrame();
      //drawCurrentFrameAnnotations();
      //drawCurrentAnnotation();
      drawSAMResults();
    });
  }, [currentFrame, video]);

//   useEffect(() => {
//     console.log("isProcessing: " + isProcessing);
//     if (video == null)
//         return;
//     if (currentFrame == null)
//         return;
//     const canvas = imageCanvasRef.current;
//     const ctx = canvas.getContext('2d');
//     if (isProcessing) {
//         // Wait for current frame to be drawn first
//         requestAnimationFrame(() => {
//             // Semi-transparent gray overlay
//             ctx.fillStyle = 'rgba(128, 128, 128, 0.5)';
//             ctx.fillRect(0, 0, canvas.width, canvas.height);
//             // Add processing text
//             const centerX = canvas.width / 2;
//             const centerY = canvas.height / 2;
//             ctx.fillStyle = 'white';
//             ctx.font = '16px Arial';
//             ctx.textAlign = 'center';
//             ctx.fillText('Processing frame for segmentation...', centerX, centerY);
//         });
//     } else {
//         // Clear any existing overlay
//         requestAnimationFrame(() => {
//             drawCurrentFrame();
//             //drawCurrentFrameAnnotations(); 
//             //drawSAMResults();
//         });
//     }
//   }, [isProcessing]);

  useEffect(() => {
    //This part acts when current annotation changes.
    //When annotating, we draw the current points and mask.
    //When not annotating, we draw existing annotations.
    if (video == null)
        return;
    if (ongoingAnnotation != null) {
        setCurrentPoints(ongoingAnnotation.points);
        setCurrentMask(ongoingAnnotation.mask);
        //drawCurrentFrame();
        //drawCurrentAnnotation();
        //drawCurrentPoints();
    }
    else{
        setCurrentMask(null);
        setCurrentPoints([]);
        //drawCurrentFrame();
        //drawCurrentFrameAnnotations();
        //drawSAMResults();
    }
  }, [ongoingAnnotation]);

  useEffect(() => {
    if (video == null)
        return;
    //if (!canvasRef.current) return;
    if (currentPoints.length == 0) {
        clearCanvas(pointsCanvasRef.current);
        clearCanvas(maskCanvasRef.current);
        return;
    }
    if (ongoingAnnotation == null) return;
    ongoingAnnotation.setPoints(currentPoints);
    const result = predict();
    const mask = result['masks']
    ongoingAnnotation.setMask(mask);
    // Use requestAnimationFrame to ensure drawing happens after state updates
    requestAnimationFrame(() => {
        // Redraw the current frame and existing annotations as base layer
        //drawCurrentFrame();
        //drawCurrentFrameAnnotations();
        //drawSAMResults();
        //drawCurrentAnnotation();
        clearCanvas(pointsCanvasRef.current);
        drawCurrentPoints();
    });
    
  }, [currentPoints]);

  useEffect(() => {
    if (video == null)
        return;
    if (currentMask == null){
        clearCanvas(maskCanvasRef.current);
        return;
    }
    if (ongoingAnnotation != null) {
        ongoingAnnotation.setMask(currentMask);
        //drawCurrentFrame();
        clearCanvas(maskCanvasRef.current);
        drawAnnotation(ongoingAnnotation);  
    }
  }, [currentMask]);

//   useEffect(() => {
//     if (viewingAnnotation != null && ongoingAnnotation == null) {
//         console.log("Drawing viewing annotation");
//         //clearCanvas(maskCanvasRef.current);
//         requestAnimationFrame(() => {
//           clearCanvas(pointsCanvasRef.current);
//           clearCanvas(bboxCanvasRef.current);
//           drawAnnotation(viewingAnnotation);
//         });
//     }
//     else{
//         // clearCanvas(maskCanvasRef.current);
//         // clearCanvas(pointsCanvasRef.current);
//         // clearCanvas(bboxCanvasRef.current);
//     }
//   }, [viewingAnnotation]);
  



  const handleCanvasClick = async (e) => {
    const canvas = imageCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    console.log('Canvas clicked at:', x, y);
    if (video.getEncoding(currentFrame) == null) {
      console.log("No encoding found for frame " + currentFrame + " so we will encode it.");
      //setIsProcessing(true);
      await processFrame(); // Wait for processing to complete
      //setIsProcessing(false); // Remove overlay after processing
    }
    
    if (ongoingAnnotation != null) {
      //We have an encoding for this frame, so we can predict the mask.
      // Transform canvas coordinates to image coordinates
      if (ongoingAnnotation.isConfirmed()) {
        console.log("Annotation is confirmed, so we will not add any more points.");
        alert("This annotation is confirmed and cannot be modified.");
        return;
      }
      const scale = Math.min(
        canvas.width / currentImageWidth,
        canvas.height / currentImageHeight
      );
      // Calculate scaled image dimensions
        const scaledWidth = currentImageWidth * scale;
        const scaledHeight = currentImageHeight * scale;

        // Calculate offsets to center image in canvas
        const offsetX = (canvas.width - scaledWidth) / 2;
        const offsetY = (canvas.height - scaledHeight) / 2;

      const imageX = ((x - offsetX) ) / scaledWidth;
      const imageY = ((y - offsetY) ) / scaledHeight;
      const newPoint = {x: imageX, y: imageY, type: 1};
            // Check if the point is within the current mask's red area
            let pointType = 1; // Default to positive point
            if (currentMask && maskCanvasRef.current) {
              const maskCtx = maskCanvasRef.current.getContext('2d');
              // Get the pixel data at the clicked point's canvas coordinates
              const canvasX = offsetX + (imageX * scaledWidth);
              const canvasY = offsetY + (imageY * scaledHeight);
              const pixelData = maskCtx.getImageData(canvasX, canvasY, 1, 1).data;
              // Check if the pixel is red (mask area)
              // Check if the pixel is part of the mask (any non-transparent color with significant alpha)
              if (pixelData[3] > 100) {
                // This is in the red mask area, so make it a negative point
                pointType = 0;
                newPoint.type = pointType;
              }
            }
            ongoingAnnotation.addPoint(newPoint);
      setCurrentPoints([...currentPoints, newPoint]);
      console.log("scale " + scale);
      console.log("scaledWidth " + scaledWidth);
      console.log("scaledHeight " + scaledHeight);
      console.log("offsetX " + offsetX);
      console.log("offsetY " + offsetY);
      console.log("Image X: " + imageX);
      console.log("Image Y: " + imageY);
      //console.log("Adding a new point " + newPoint.x + " " + newPoint.y);
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
        setIsProcessing(true);
        // Allow state update to propagate before starting expensive operation
        await new Promise(resolve => setTimeout(resolve, 0));
        
        const startTime = performance.now();
        const new_embedding = await encoder.encode(currentImage);
        const endTime = performance.now();
        console.log(`Frame processing took ${endTime - startTime}ms`);
        video.setEncoding(currentFrame, new_embedding);
        setIsProcessing(false);
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
        className="w-full h-full absolute top-0 left-0 z-20"
        style={{ width: '100%', height: '100%' }}
      />
      <canvas
        ref={bboxCanvasRef}
        className="w-full h-full absolute top-0 left-0 z-30"
        style={{ width: '100%', height: '100%' }}
      />
      <canvas
        ref={pointsCanvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        className="w-full h-full absolute top-0 left-0 z-40"
        style={{ width: '100%', height: '100%' }}
      />
      {isProcessing && (
        <canvas
          className="w-full h-full absolute top-0 left-0 z-50"
          style={{ 
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.75)'
          }}
          ref={(canvas) => {
            if (canvas) {
              const ctx = canvas.getContext('2d');
              if (ctx) {
                // Create semi-transparent background for text
                const textWidth = canvas.width * 0.6; // 60% of canvas width
                const textHeight = 40;
                const x = (canvas.width - textWidth) / 2;
                const y = (canvas.height - textHeight) / 2;
                
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillRect(x, y, textWidth, textHeight);
                
                // Draw text
                ctx.fillStyle = 'white';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('Processing for segmentation', canvas.width/2, canvas.height/2);
              }
            }
          }}
        />
      )}
    </div>
  );
});

export default AnnotationPanel;
