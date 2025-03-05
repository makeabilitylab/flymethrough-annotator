import React from 'react';
import Annotation from '../Annotation.tsx';

const AnnotationToolsPanel = (props) => {
  const [customTypes, setCustomTypes] = React.useState([]);
  const [newTypeName, setNewTypeName] = React.useState('');
  const defaultObjectTypes = [
    { name: 'Door', id: 1 },
    { name: 'Elevator', id: 2 }, 
    { name: 'Stairs', id: 3 },
    { name: 'Ramp', id: 4 },
    { name: 'Entrance', id: 5 },
    { name: 'Front Desk', id: 6 },
    { name: 'Restroom', id: 7 }
  ];
  const objectTypes = [...defaultObjectTypes, ...customTypes];
  const [typeCounts, setTypeCounts] = React.useState(
    defaultObjectTypes.reduce((acc, type) => ({...acc, [type.id]: 1}), {})
  );

  const [totalAnnotations, setTotalAnnotations] = React.useState(0);

  const addCustomType = () => {
    if (newTypeName.trim()) {
      const newType = {
        name: newTypeName.trim(),
        id: defaultObjectTypes.length + customTypes.length + 1
      };
      setCustomTypes([...customTypes, newType]);
      setTypeCounts({...typeCounts, [newType.id]: 1});
      setNewTypeName('');
    }
  };

  const createNewAnnotation = (type) => {
    if (props.ongoingAnnotation) {
        if (props.ongoingAnnotation.isValid()) {
            console.log("Saving previous annotation");
            props.video.addAnnotation(props.ongoingAnnotation);
        }
        else {
            console.log("Invalid annotation, not saving");
        }
    }
    console.log("Creating new annotation");
    const newAnnotation = new Annotation(props.currentFrame, type.name, totalAnnotations, typeCounts[type.id]);
    setTotalAnnotations(totalAnnotations + 1);
    setTypeCounts({...typeCounts, [type.id]: typeCounts[type.id] + 1});
    props.setOngoingAnnotation(newAnnotation);
  }

  const clearPoints = () => {
    props.ongoingAnnotation.clearPoints();
  }

  const removeAnnotation = () => {
    props.setOngoingAnnotation(null);
  }

  const confirmAnnotation = () => {
    props.confirmAnnotation();
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
              <span className="text-base text-black font-bold">
                {props.ongoingAnnotation.annotationID}
              </span>
              <div className="flex gap-2 items-center">
                <span className="text-green-600 font-bold">
                  +{props.ongoingAnnotation.getPositivePoints().length}
                </span>
                <span className="text-red-600 font-bold">
                  -{props.ongoingAnnotation.getNegativePoints().length}
                </span>
              </div>
            </div>
            <div className="flex gap-2 flex-col">
              <div className="flex gap-2">
                <button className="btn btn-sm btn-info flex-1 hover:bg-sky-600" onClick={clearPoints}>Clear Points</button>
                <button className="btn btn-sm btn-warning flex-1 hover:bg-amber-600" onClick={removeAnnotation}>Remove Annotation</button>
              </div>
              <button className="btn btn-sm btn-success hover:bg-green-600" onClick={confirmAnnotation}>Confirm Annotation</button>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 text-sm">
            Select an object type to start annotating
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnotationToolsPanel;