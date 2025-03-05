import React, { useState } from 'react';

const AnnotationResultsPanel = (props) => {

  return (
    <div className="w-64 bg-base-200 p-4">
      <h3 className="text-lg font-bold mb-4">Annotation Results</h3>
      <div className="flex flex-col gap-2">
        {props.video.getAllAnnotations().map((annotation) => (
          <div 
            key={annotation.getId()}
            className="bg-base-300 p-3 rounded-lg flex justify-between items-center"
          >
            <div>
              <span className="font-medium">{annotation.getId()}</span>
              <div className="text-sm opacity-70">
                Initial Frame: {annotation.getInitialFrame()}
              </div>
              <div className="text-sm opacity-70">
                {annotation.getBBoxes().length > 0 
                  ? `${annotation.getBBoxes().length} bounding boxes` 
                  : "Processing..."}
              </div>
            </div>
            <button 
              className="btn btn-sm btn-ghost"
              onClick={() => {
                // Navigate to the initial frame
                const frameIndex = annotation.getBBoxes().length > 0 
                  ? annotation.getBBoxes()[0].frameIndex 
                  : 0;
                props.setCurrentFrame(frameIndex);
                props.setOngoingAnnotation(annotation);
              }}
            >
              View
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnnotationResultsPanel;
