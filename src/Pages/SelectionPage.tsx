import VideoList from '../Components/SelectionInterface/VideoList.tsx';
import { useEffect, useState} from 'react';
    import axios from 'axios';
    

const SelectionPage = (props)  => {

  
  return (
    <div className="min-h-screen bg-base-200">
      <div className="hero bg-base-100 shadow-xl py-8 mb-8">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold text-primary">Select a Video</h1>
            <p className="py-6">Choose a video to begin annotation</p>
          </div>
        </div>
      </div>
      <VideoList videos={props.videos} setVideo={props.setVideo} />
    </div>
  );
};

export default SelectionPage;
