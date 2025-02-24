import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import SelectionPage from './Pages/SelectionPage.tsx';
import AnnotationPage from './Pages/AnnotationPage.tsx';
import Video from './Components/Video.tsx';
import axios from 'axios';
import { useState, useEffect } from 'react';

const AppRoutes = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState(null);

  const selectVideo = (video: Video) => {
    setSelectedVideo(video);
    navigate(`/annotate/${video.getName()}`);
  }

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await axios.get('http://localhost/videos');
        console.log(response.data);
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

const App = () => {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
};

export default App;