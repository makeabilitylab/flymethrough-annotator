import React, { useState, useRef } from 'react';

const AnnotationResultsPanel = (props) => {
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const lastClickTimeRef = useRef(0);

  const handleViewClick = (annotation) => {
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTimeRef.current;
    
    // Enforce a minimum of 1 second between clicks
    if (timeSinceLastClick < 1000 || isButtonDisabled) {
      return;
    }
    
    // Update last click time and disable button
    lastClickTimeRef.current = now;
    setIsButtonDisabled(true);
    
    // First set the current frame and wait for it to complete
    props.setCurrentFrame(annotation.getInitialFrame());
    
    // Use setTimeout with 0ms delay to ensure the frame change completes first
    setTimeout(() => {
      props.setOngoingAnnotation(annotation);
      
      // Re-enable the button after 1 second
      setTimeout(() => {
        setIsButtonDisabled(false);
      }, 1000);
    }, 0);
  };

  return (
    <div className="w-64 bg-base-200 p-4 flex flex-col h-full">
      <h3 className="text-lg font-bold mb-2">Annotation Results</h3>
      <div className="flex flex-col gap-1 overflow-y-auto flex-grow" style={{ height: 'calc(100vh - 200px)' }}>
        {props.video.getAllAnnotations().map((annotation) => (
          <div 
            key={annotation.getId()}
            className="bg-base-300 p-2 rounded-lg flex justify-between items-center text-xs"
          >
            <div className="overflow-hidden">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-1" 
                  style={{ backgroundColor: annotation.color }}
                ></div>
                <span className="font-medium">{annotation.getId()}</span>
              </div>
              <div className="opacity-70 truncate">
                Frame: {annotation.getInitialFrame()}
              </div>
              <div className="opacity-70 truncate">
                {annotation.getBBoxes().length > 0 
                  ? `${annotation.getBBoxes().length} boxes` 
                  : "Processing..."}
              </div>
            </div>
            <button 
              className={`btn btn-xs ${isButtonDisabled ? 'btn-disabled' : 'btn-ghost'} ml-1`}
              onClick={() => handleViewClick(annotation)}
              disabled={isButtonDisabled}
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
