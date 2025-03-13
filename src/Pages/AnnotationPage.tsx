import React from 'react';

import { useParams } from 'react-router-dom';
import AnnotationPanel from '../Components/AnnotationInterface/AnnotationPanel.tsx';
import FramesPanel from '../Components/AnnotationInterface/FramesPanel.tsx';
import AnnotationResultsPanel from '../Components/AnnotationInterface/AnnotationResultsPanel.tsx';
import AnnotationToolsPanel from '../Components/AnnotationInterface/AnnotationToolsPanel.tsx';
import Video from '../Components/Video.tsx';
import Annotation from '../Components/Annotation.tsx';
import { useRef, useState, useEffect } from 'react';
import SAM2Encoder from '../Components/SAM/encoder.tsx';
import SAM2Predictor from '../Components/SAM/decoder.tsx';

const AnnotationPage = (props) => {
  const { video } = props as { video: Video };
  const [selectedOnEditType, setSelectedOnEditType] = useState(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentFrame, setCurrentFrame] = useState<number | null>(null);
  const [ongoingAnnotation, setOngoingAnnotation] = useState<Annotation | null>(null);
  const [viewingAnnotation, setViewingAnnotation] = useState<Annotation | null>(null);
  const [isPositive, setIsPositive] = useState(true);
  const [encoder, setEncoder] = useState<SAM2Encoder | null>(null);
  const [predictor, setPredictor] = useState<SAM2Predictor | null>(null);
  const [embedding, setEmbedding] = useState<Float32Array | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const annotationPanelRef = useRef<AnnotationPanel>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const reviewIntervalRef = useRef(null);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const init = async () => {
      console.log("Initializing encoder and predictor");
      const encoder_init = new SAM2Encoder();
      const predictor_init = new SAM2Predictor();
      await encoder_init.initialize();
      await predictor_init.initialize();
      setIsInitialized(true);
      console.log("Models initialized");
      console.log("Encoder: ", encoder_init);
      console.log("Predictor: ", predictor_init);
      setEncoder(encoder_init);
      setPredictor(predictor_init);
    };
    init();
  },[]);

  // Handle space key to toggle review playback and arrow keys for frame navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space' && isReviewing) {
        e.preventDefault(); // Prevent scrolling when space is pressed
        
        // Stop the review completely instead of pausing
        if (reviewIntervalRef.current) {
          clearInterval(reviewIntervalRef.current);
          reviewIntervalRef.current = null;
          setIsReviewing(false);
          console.log("Review stopped");
        }
      } else if (e.code === 'ArrowRight' && video) {
        e.preventDefault();
        setViewingAnnotation(null);
        setCurrentFrame(prevFrame => {
          if (prevFrame === null || prevFrame >= video.getImageCount() - 1) {
            return prevFrame;
          }
          return prevFrame + 1;
        });
      } else if (e.code === 'ArrowLeft' && video) {
        e.preventDefault();
        setViewingAnnotation(null);
        setCurrentFrame(prevFrame => {
          if (prevFrame === null || prevFrame <= 0) {
            return 0;
          }
          return prevFrame - 1;
        });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isReviewing, video]);

  const confirmAnnotation = (description: string) => {
    if (ongoingAnnotation) {
      ongoingAnnotation.setConfirmed(true);
      video.addAnnotation(ongoingAnnotation);
      console.log("Annotation added to video", ongoingAnnotation);
      // Compress mask data by:
      // 1. Converting Float32 mask to binary (0/1)
      // 2. Run-length encoding the binary values
      // 3. Converting to base64 string for transmission
      const compressMask = (mask: {data: Float32Array, dims: number[]}) => {
        // Convert float mask to binary
        const binaryMask = Array.from(mask.data).map(val => val > 0.5 ? 1 : 0);
        
        // Run-length encode
        const rle: Array<[number, number]> = [];
        let count = 1;
        let current = binaryMask[0];
        
        for(let i = 1; i < binaryMask.length; i++) {
          if(binaryMask[i] === current) {
            count++;
          } else {
            rle.push([current, count]);
            current = binaryMask[i];
            count = 1;
          }
        }
        rle.push([current, count]);
        
        // Convert to base64
        const rleStr = JSON.stringify({
          encoding: rle,
          width: mask.dims[3],
          height: mask.dims[2]
        });
        const base64 = btoa(rleStr);
        
        return base64;
      };

      // Prepare mask data for transmission
      const maskData = {
        space_name: video.getName(),
        frame_name: video.getFrameFilename(currentFrame),
        object_id: ongoingAnnotation.getId(),
        mask: compressMask(ongoingAnnotation.getMask()),
        description: description
      };

      // Send to server
      const startTime = new Date().getTime();
      fetch('https://settled-stirring-fawn.ngrok-free.app/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(maskData),
        mode: "cors", // Ensures CORS is handled properly
        credentials: "omit" // Prevents sending cookies, which can trigger CORS issues
      })
      .then(response => response.json())
      .then(data => {
        const endTime = new Date().getTime();
        const processTime = endTime - startTime;
        console.log(`Processing took ${processTime}ms`);
        
        console.log('Data back from server: ', data);
        // Parse the response data
        if (data && data.results) {
          // Extract the necessary information
          const { space_name, object_id, results } = data;
          
          console.log(`Processing results for video: ${space_name}, annotation ID: ${object_id}`);
          if (space_name != video.getName()) {
            console.log("Space name does not match, skipping");
            return;
          }
          
          // Process each result item
          if (Array.isArray(results)) {
            results.forEach(item => {
              if (item.frame && item.bbox) {
                const frameNumber = video.getFrameIndex(item.frame);
                const bbox = item.bbox; // [x1, y1, x2, y2] in 0-1 scale
                console.log(`Adding bbox for frame ${frameNumber}: ${bbox}`);
                // Add the bbox data to the corresponding annotation in the video
                if (!isNaN(frameNumber)) {
                  console.log(`Adding bbox for frame ${frameNumber}: ${bbox}`);
                  video.addBBoxToAnnotation(frameNumber, object_id, bbox);
                }
              }
            });
          }
          const annotation = video.getAnnotationsByObjectID(object_id)[0];
          annotation.setProcessed(true);
          annotation.setProcessTime(processTime/1000);
          // Force a refresh of the annotation results panel
          //setOngoingAnnotation({...ongoingAnnotation});
          console.log('Successfully processed and added SAM2 results to video');
        } else {
          console.warn('Received data in unexpected format:', data);
        }
      })
      .catch((error) => {
        console.error('Error saving mask:', error);
      });
      console.log("Mask data: ", maskData);
      setOngoingAnnotation(null);
    }
  }
  const reviewVideo = () => {
    console.log("Reviewing video");
    // Set up a review mode that plays through the video at 2 frames per second
    
    // Start the review process
    if (!isReviewing) {
      setIsReviewing(true);
      
      // Start from the current frame instead of resetting to the beginning
      // No need to call setCurrentFrame here as we're already at the desired frame
      
      // Set up an interval to advance frames at 2fps (500ms per frame)
      reviewIntervalRef.current = setInterval(() => {
        setCurrentFrame(prevFrame => {
          // If we've reached the end of the video, stop the review
          if (prevFrame >= video.getImageCount() - 1) {
            clearInterval(reviewIntervalRef.current);
            setIsReviewing(false);
            return prevFrame;
          }
          return prevFrame + 1;
        });
      }, 500); // 500ms = 2 frames per second
      
      // Return a cleanup function to stop the interval if needed
      return () => {
        if (reviewIntervalRef.current) {
          clearInterval(reviewIntervalRef.current);
          setIsReviewing(false);
        }
      };
    }
  }
  const finishAnnotation = () => {
    console.log("Finishing annotation");
    setIsFinished(true);
  }

  return (
    <>
      {!isInitialized ? (
        <div className="flex items-center justify-center h-50vh">
          <p className="text-3xl font-bold text-center">Initializing models, please wait...</p>
        </div>
      ) : isFinished ? (
        <div className="flex items-center justify-center h-50vh flex-col bg-base-200 p-8 rounded-lg">
          <h2 className="text-3xl font-bold mb-4">Annotation Complete</h2>
          <div className="stats shadow mb-4">
            <div className="stat">
              <div className="stat-title">Total Annotations</div>
              <div className="stat-value">{video.getAllAnnotations().length}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Average Processing Time</div>
              <div className="stat-value">
                {(video.getAllAnnotations().reduce((sum, annotation) => sum + annotation.getProcessTime(), 0) / 
                  (video.getAllAnnotations().length || 1)).toFixed(2)}s
              </div>
            </div>
          </div>
          <p className="text-lg mb-4">Thank you for completing this annotation task!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', height: '50vh' }}>
          <div style={{ display: 'flex', flex: 1 }}>
            <AnnotationResultsPanel video={video} setCurrentFrame={setCurrentFrame} setOngoingAnnotation={setOngoingAnnotation} setViewingAnnotation={setViewingAnnotation}/>
            <div style={{ flex: 1 }}>
              <AnnotationPanel ref={annotationPanelRef} video={video} currentFrame={currentFrame} isProcessing={isProcessing} setIsProcessing={setIsProcessing}
              ongoingAnnotation={ongoingAnnotation} setOngoingAnnotation={setOngoingAnnotation} viewingAnnotation={viewingAnnotation} setViewingAnnotation={setViewingAnnotation}
              encoder={encoder} predictor={predictor} />
            </div>
            <AnnotationToolsPanel video={video} isPositive={isPositive} setIsPositive={setIsPositive} currentFrame={currentFrame}
            ongoingAnnotation={ongoingAnnotation} setOngoingAnnotation={setOngoingAnnotation} confirmAnnotation={confirmAnnotation} 
            clearPoints={annotationPanelRef.current?.clearPoints} setViewingAnnotation={setViewingAnnotation} reviewVideo={reviewVideo} finishAnnotation={finishAnnotation} />
          </div>
          <div style={{ flexShrink: 0, height: 100 }}>
            <FramesPanel video={video} currentFrame={currentFrame} setCurrentFrame={setCurrentFrame} setViewingAnnotation={setViewingAnnotation} />
          </div>
        </div>
      )}
    </>
  );
};

export default AnnotationPage;