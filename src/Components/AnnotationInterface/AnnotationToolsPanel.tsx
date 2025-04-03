import React from 'react';
import Annotation from '../Annotation.tsx';

const AnnotationToolsPanel = (props) => {
  const [customTypes, setCustomTypes] = React.useState([]);
  const [newTypeName, setNewTypeName] = React.useState('');
  const defaultObjectTypes = [
    { name: 'Entrance', id: 1, color: '#FF5733' },
    { name: 'Elevator', id: 2, color: '#33FF57' },
    { name: 'Stairs', id: 3, color: '#3357FF' },
    { name: 'Restroom', id: 4, color: '#F033FF' },
    { name: 'Door', id: 5, color: '#FF9933' },
    { name: 'Ramp', id: 6, color: '#33FFF9' },
    { name: 'Front Desk', id: 7, color: '#FFFF33' }
  ];
  const objectTypes = [...defaultObjectTypes, ...customTypes];
  const [typeCounts, setTypeCounts] = React.useState(
    defaultObjectTypes.reduce((acc, type) => ({...acc, [type.id]: 1}), {})
  );
  const [description, setDescription] = React.useState('');

  const [totalAnnotations, setTotalAnnotations] = React.useState(0);

  // Generate a random color for new custom types
  const generateRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const addCustomType = () => {
    if (newTypeName.trim()) {
      const newType = {
        name: newTypeName.trim(),
        id: defaultObjectTypes.length + customTypes.length + 1,
        color: generateRandomColor()
      };
      setCustomTypes([...customTypes, newType]);
      setTypeCounts({...typeCounts, [newType.id]: 1});
      setNewTypeName('');
    }
  };

  const createNewAnnotation = (type) => {
    if (props.ongoingAnnotation) {
        if (props.ongoingAnnotation.isValid()) {
            console.log("Discarding this annotation");
            //props.video.addAnnotation(props.ongoingAnnotation);
        }
        else {
            console.log("Invalid annotation, not saving");
        }
    }
    console.log("Creating new annotation");
    const newAnnotation = new Annotation(props.currentFrame, type.name, totalAnnotations, typeCounts[type.id], type.color);
    setTotalAnnotations(totalAnnotations + 1);
    setTypeCounts({...typeCounts, [type.id]: typeCounts[type.id] + 1});
    props.setOngoingAnnotation(newAnnotation);
    props.setViewingAnnotation(null);
  }

  const clearPoints = () => {
    props.clearPoints();
  }

  const removeAnnotation = () => {
    props.setOngoingAnnotation(null);
    setDescription('');
  }

  const confirmAnnotation = () => {
    props.confirmAnnotation(description);
    setDescription('');
  }

  return (
    <div className="w-64 bg-base-200 p-2 flex flex-col gap-2 h-full">
      {/* Object Types Panel */}
      <div className="bg-base-300 p-3 rounded-lg flex flex-col">
        <h3 className="text-lg font-bold mb-2">Object Types</h3>
        
        {/* Scrollable Types List */}
        <div 
          className="h-48 mb-2 overflow-y-scroll" 
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#666 #333'
          }}
          ref={(el) => {
            if (el) {
              el.scrollTop = el.scrollHeight;
            }
          }}
        >
          {objectTypes.map((type) => (
            <div key={type.id} className="flex items-center gap-1 text-sm mb-1">
              <div 
                className="w-4 h-4 rounded-full mr-1" 
                style={{ backgroundColor: type.color }}
              ></div>
              <span className="flex-1">{type.name}</span>
              <button className="btn btn-xs btn-primary" onClick={() => createNewAnnotation(type)}>Add</button>
            </div>
          ))}
        </div>

        {/* Fixed Add Custom Type Section */}
        <div className="flex gap-1 text-sm">
          <input
            type="text"
            value={newTypeName}
            onChange={(e) => setNewTypeName(e.target.value)}
            placeholder="New type name"
            className="input input-bordered input-xs flex-1"
          />
          <button 
            className="btn btn-xs btn-secondary"
            onClick={addCustomType}
            disabled={!newTypeName.trim()}
          >
            Add
          </button>
        </div>
      </div>

      {/* Action Buttons Panel */}
      <div className="bg-base-300 p-3 rounded-lg h-[140px]">
        {props.ongoingAnnotation ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-black font-bold leading-tight">
                {props.ongoingAnnotation.annotationID}
              </span>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input input-xs input-bordered mt-1 w-full"
                placeholder="description of this object"
              />
            </div>
            {props.ongoingAnnotation.isConfirmed() ? (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                This annotation is confirmed and cannot be changed
              </div>
            ) : (
              <div className="flex gap-2 flex-col">
                <div className="flex gap-2">
                  <button className="btn btn-sm btn-info flex-1 hover:bg-sky-600" onClick={clearPoints}>Clear Points</button>
                  <button className="btn btn-sm btn-warning flex-1 hover:bg-amber-600" onClick={removeAnnotation}>Remove Annotation</button>
                </div>
                <button className="btn btn-sm btn-success hover:bg-green-600" onClick={confirmAnnotation}>Confirm Annotation</button>
              </div>
            )}
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 text-sm">
            Select an object type to start annotating
          </div>
        )}
      </div>

      {/* Final Actions Panel */}
      <div className="bg-base-300 p-3 rounded-lg">
        <h3 className="text-lg font-bold mb-2">Final Actions</h3>
        <div className="flex gap-2 flex-col">
          <button 
            className="btn btn-sm btn-primary hover:bg-blue-600" 
            onClick={props.reviewVideo}
            title="Play video frames from this current frame. Press space to stop"
          >
            Review Video
          </button>
          <button 
            className="btn btn-sm btn-accent hover:bg-purple-600" 
            onClick={() => {
              // Check if all annotations are processed
              const allAnnotations = props.video.getAllAnnotations();
              const unprocessedAnnotations = allAnnotations.filter(
                annotation => !annotation.isProcessed()
              );
              
              if (unprocessedAnnotations.length > 0) {
                alert(`You have ${unprocessedAnnotations.length} unprocessed annotations. Please complete them before finishing.`);
                // If there's an unprocessed annotation, navigate to its frame
                if (unprocessedAnnotations[0]) {
                  //props.setCurrentFrame(unprocessedAnnotations[0].getInitialFrame());
                  //props.setOngoingAnnotation(unprocessedAnnotations[0]);
                }
              } else if (window.confirm('Are you sure you want to finish this annotation? This action cannot be undone.')) {
                props.finishAnnotation();
              }
            }}
            title="Finish this annotation"
          >
            Finish Annotation
          </button>
        </div>
      </div>
    </div>
  )
};

export default AnnotationToolsPanel;