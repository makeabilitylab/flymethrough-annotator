import React, { useState } from 'react';

const AnnotationResultsPanel = () => {
  const [annotationResults, setAnnotationResults] = useState([
    { frameNumber: 1, instances: 3 },
    { frameNumber: 2, instances: 2 },
    { frameNumber: 4, instances: 1 },
  ]); // Mock data for now

  return (
    <div className="w-64 bg-base-200 p-4">
      <h3 className="text-lg font-bold mb-4">Annotation Results</h3>
      <div className="flex flex-col gap-2">
        {annotationResults.map((result) => (
          <div 
            key={result.frameNumber}
            className="bg-base-300 p-3 rounded-lg flex justify-between items-center"
          >
            <div>
              <span className="font-medium">Frame {result.frameNumber}</span>
              <div className="text-sm opacity-70">
                {result.instances} instance{result.instances !== 1 ? 's' : ''}
              </div>
            </div>
            <button className="btn btn-sm btn-ghost">
              View
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnnotationResultsPanel;
