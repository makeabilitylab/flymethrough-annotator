import VideoList from '../Components/SelectionInterface/VideoList.tsx';
// Removed unused imports - useEffect, useState, axios
import Video from '../Components/Video.tsx';

/**
 * Video selection page component
 * Displays available videos in a grid layout and handles video selection
 */
interface SelectionPageProps {
  videos: Video[];
  setVideo: (video: Video) => void;
}

const SelectionPage = ({ videos, setVideo }: SelectionPageProps) => {
  return (
    <div className="min-h-screen bg-base-200">
      {/* Header section */}
      <div className="hero bg-base-100 shadow-xl py-8 mb-8">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold text-primary">FlyMeThrough</h1>
            <p className="py-6 text-lg">Professional Video Annotation Tool</p>
            <p className="text-sm opacity-70">Select a video to begin annotation with SAM2</p>
          </div>
        </div>
      </div>
      
      {/* Video selection grid */}
      <VideoList videos={videos} setVideo={setVideo} />
    </div>
  );
};

export default SelectionPage;
