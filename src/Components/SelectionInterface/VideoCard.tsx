  const VideoCard = ({ video, onSelect }) => {
    return (
      <div className="card w-80 bg-base-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer m-4" onClick={onSelect}>
        <figure>
          <img 
            src={video.getThumbnail()} 
            alt={`${video.getName()} thumbnail`}
            className="w-full h-40 object-cover"
          />
        </figure>
        <div className="card-body">
          <h2 className="card-title">{video.getName()}</h2>
          <p className="text-gray-600">{video.getImageCount()} images</p>
        </div>
      </div>
    );
  };

  export default VideoCard;