import React from 'react';
import { useParams } from 'react-router-dom';
import AnnotationPanel from '../Components/AnnotationInterface/AnnotationPanel.tsx';
import FramesPanel from '../Components/AnnotationInterface/FramesPanel.tsx';
import AnnotationResultsPanel from '../Components/AnnotationInterface/AnnotationResultsPanel.tsx';
import AnnotationToolsPanel from '../Components/AnnotationInterface/AnnotationToolsPanel.tsx';
import Video from '../Components/Video.tsx';
import Annotation from '../Components/Annotation.tsx';
import { useState, useEffect } from 'react';
import SAM2Encoder from '../Components/SAM/encoder.tsx';
import SAM2Predictor from '../Components/SAM/decoder.tsx';

const AnnotationPage = (props) => {
  const { video } = props as { video: Video };
  const [selectedOnEditType, setSelectedOnEditType] = useState(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentFrame, setCurrentFrame] = useState<number | null>(null);
  const [ongoingAnnotation, setOngoingAnnotation] = useState<Annotation | null>(null);
  const [isPositive, setIsPositive] = useState(true);
  const [encoder, setEncoder] = useState<SAM2Encoder | null>(null);
  const [predictor, setPredictor] = useState<SAM2Predictor | null>(null);
  const [embedding, setEmbedding] = useState<Float32Array | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

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

  const confirmAnnotation = () => {
    if (ongoingAnnotation) {
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
        frame_name: currentFrame,
        object_id: ongoingAnnotation.getId(),
        mask: compressMask(ongoingAnnotation.getMask()),
      };

      // Send to server
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
        console.log('Data back from server: ', data);
        // Parse the response data
        if (data && data.result) {
          // Extract the necessary information
          const { space_name, object_id, result } = data;
          
          console.log(`Processing results for video: ${space_name}, annotation ID: ${object_id}`);
          if (space_name != video.getName()) {
            console.log("Space name does not match, skipping");
            return;
          }
          
          // Process each result item
          if (Array.isArray(result)) {
            result.forEach(item => {
              if (item.frame && item.bbox) {
                const frameNumber = parseInt(item.frame);
                const bbox = item.bbox; // [x1, y1, x2, y2] in 0-1 scale
                
                // Add the bbox data to the corresponding annotation in the video
                if (!isNaN(frameNumber)) {
                  console.log(`Adding bbox for frame ${frameNumber}: ${bbox}`);
                  video.addBBoxToAnnotation(frameNumber, object_id, bbox);
                }
              }
            });
          }
          ongoingAnnotation.setProcessed(true);
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

  return (
    <>
      {!isInitialized ? (
        <div className="flex items-center justify-center h-50vh">
          <p className="text-3xl font-bold text-center">Initializing models, please wait...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', height: '50vh' }}>
          <div style={{ display: 'flex', flex: 1 }}>
            <AnnotationResultsPanel video={video} setCurrentFrame={setCurrentFrame} setOngoingAnnotation={setOngoingAnnotation}/>
            <div style={{ flex: 1 }}>
              <AnnotationPanel video={video} currentFrame={currentFrame} isProcessing={isProcessing} setIsProcessing={setIsProcessing}
              ongoingAnnotation={ongoingAnnotation} setOngoingAnnotation={setOngoingAnnotation} 
              encoder={encoder} predictor={predictor} />
            </div>
            <AnnotationToolsPanel video={video} isPositive={isPositive} setIsPositive={setIsPositive} currentFrame={currentFrame}
            ongoingAnnotation={ongoingAnnotation} setOngoingAnnotation={setOngoingAnnotation} confirmAnnotation={confirmAnnotation}/>
          </div>
          <div style={{ flexShrink: 0, height: 100 }}>
            <FramesPanel video={video} currentFrame={currentFrame} setCurrentFrame={setCurrentFrame} />
          </div>
        </div>
      )}
    </>
  );
};

export default AnnotationPage;