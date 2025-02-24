import { useState, useEffect } from 'react';

const FramesPanel = ({ video, currentFrame, setCurrentFrame }) => {
  const [frames, setFrames] = useState([]);

  useEffect(() => {
    if (video) {
      setFrames(video.getCompressedFrames());
    }
  }, [video]);

  return (
    <div className="w-full h-32 bg-base-300 overflow-x-auto">
      <div className="flex flex-row p-2 gap-2">
        {frames.map((frame, index) => (
          <div 
            key={index}
            className={`flex-none w-24 h-24 rounded-lg overflow-hidden hover:ring-2 hover:ring-primary cursor-pointer relative ${
              currentFrame === index ? 'ring-2 ring-accent' : ''
            }`}
            onClick={() => setCurrentFrame(index)}
          >
            <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
              {frame.split('/').pop()}
            </div>
            <img
              src={frame}
              alt={`Frame ${index}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default FramesPanel;
