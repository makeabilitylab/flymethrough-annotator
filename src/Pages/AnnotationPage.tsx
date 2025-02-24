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

  useEffect(() => {
    async function loadImageFromURL(url) {
      return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous'; // Enable CORS for external images
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error(`Failed to load image from ${url}`));
          img.src = url;
      });
  }
    const processFrame = async () => {
      if (currentFrame) {
        const startTime = performance.now();
        const url = video.getRawFrame(currentFrame);
        const img = await loadImageFromURL(url);
        console.log("Image loaded. Using this encoder to get embedding", encoder);
        const new_embedding = await encoder.encode(img);
        const endTime = performance.now();
        console.log(`Frame processing took ${endTime - startTime}ms`);
        setEmbedding(new_embedding);
        setIsProcessing(false);
        //const mask = predictor.predict(embedding, ongoingAnnotation.getPoints(), image.height, image.width);
      }
    };
    //setIsProcessing(true);
    //processFrame();

  }, [currentFrame]);

  return (
    <>
      {!isInitialized ? (
        <div className="flex items-center justify-center h-50vh">
          <p className="text-3xl font-bold text-center">Initializing models, please wait...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', height: '50vh' }}>
          <div style={{ display: 'flex', flex: 1 }}>
            <AnnotationResultsPanel video={video}/>
            <div style={{ flex: 1 }}>
              <AnnotationPanel video={video} currentFrame={currentFrame} isProcessing={isProcessing} />
            </div>
            <AnnotationToolsPanel video={video} isPositive={isPositive} setIsPositive={setIsPositive} 
            ongoingAnnotation={ongoingAnnotation} setOngoingAnnotation={setOngoingAnnotation}/>
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