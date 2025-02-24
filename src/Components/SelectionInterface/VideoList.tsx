import VideoCard from './VideoCard.tsx';

const VideoList = (props) => {

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {props.videos.map((video) => (
          <VideoCard
            key={video.getName()}
            video={video}
            onSelect={() => props.setVideo(video)}
          />
        ))}
      </div>
    </div>
  );
};

export default VideoList;