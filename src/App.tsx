import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import SelectionPage from './Pages/SelectionPage.tsx';
import AnnotationPage from './Pages/AnnotationPage.tsx';
import Video from './Components/Video.tsx';
import axios from 'axios';
import { useState, useEffect } from 'react';

/**
 * FlyMeThrough - Professional Video Annotation Tool
 * A React application for annotating videos using SAM2 (Segment Anything Model 2)
 * for research and development purposes.
 */

/**
 * Main routing component that handles navigation between pages
 * and manages video state across the application
 */
const AppRoutes = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState(null);

  /**
   * Handles video selection and navigation to annotation page
   */
  const selectVideo = (video: Video) => {
    setSelectedVideo(video);
    navigate(`/annotate/${video.getName()}`);
  };

  /**
   * Fetches available videos from the backend on component mount
   */
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await axios.get('http://localhost/videos');
        console.log('Fetched videos:', response.data);
        const videoInstances = response.data.map(videoData => new Video(videoData));
        setVideos(videoInstances);
      } catch (error) {
        console.error('Error fetching videos:', error);
      }
    };

    fetchVideos();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<SelectionPage videos={videos} setVideo={selectVideo}/>} />
      <Route path="/annotate/:videoName" element={<AnnotationPage video={selectedVideo}/>} />
    </Routes>
  );
};

/**
 * Root application component
 */
const App = () => {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
};

export default App;