import { useState } from 'react';
import Annotation from './Annotation';

interface VideoData {
  name: string;
  image_count: number;
  image: string;
}

interface Segmentation {
  frameIndex: number;
  data: any; // Replace with specific segmentation data structure
  timestamp: Date;
}

class Video {
  private videoData: VideoData;
  private frames: string[];
  private annotations: Annotation[];
  private currentFrameIndex: number;
  private segmentations: Segmentation[];
  private encodings: { [frameIndex: number]: Float32Array } = {};

  constructor(videoData: VideoData) {
    this.videoData = videoData;
    this.annotations = [];
    this.frames = this.videoData.frames;
    this.segmentations = [];
    this.currentFrameIndex = 0;
  }

  // Getters

  getName(): string {
    return this.videoData.name;
  }

  getImageCount(): number {
    return this.videoData.image_count;
  }

  getThumbnail(): string {
    return 'http://localhost/video_images_compressed/' + this.videoData.name + '/' + this.videoData.image;
  }

  getCompressedFrame(index: number): string {
    if (index >= 0 && index < this.frames.length) {
      return 'http://localhost/video_images_compressed/' + this.videoData.name + '/' + this.frames[index];
    }
    throw new Error('Frame index out of bounds');
  }

  getRawFrame(index: number): string {
    if (index >= 0 && index < this.frames.length) {
      return 'http://localhost/video_images_raw/' + this.videoData.name + '/' + this.frames[index];
    }
    throw new Error('Frame index out of bounds');
  }

  getCompressedFrames(): string[] {
    return this.frames.map(frame => 'http://localhost/video_images_compressed/' + this.videoData.name + '/' + frame);
  }

  getRawFrames(): string[] {
    return this.frames.map(frame => 'http://localhost/video_images_raw/' + this.videoData.name + '/' + frame);
  }

  // Frame navigation
  setCurrentFrame(index: number): void {
    if (index >= 0 && index < this.videoData.image_count) {
      this.currentFrameIndex = index;
    }
  }

  setEncoding(index: number, encoding: Float32Array): void {
    this.encodings[index] = encoding;
  }

  getEncoding(index: number): Float32Array | null {
    if (!this.encodings[index]) return null;
    return this.encodings[index];
  }

  // Annotation methods
  addAnnotation(annotation: Annotation): void {
    this.annotations.push(annotation);
  }

  getAnnotationsForFrame(frameIndex: number): Annotation[] {
    return this.annotations.filter(a => a.frameIndex === frameIndex);
  }

  getAllAnnotations(): Annotation[] {
    return [...this.annotations];
  }

  getAnnotationsForFrame(frameIndex: number): Annotation[] {
    return this.annotations.filter(a => a.frameIndex === frameIndex);
  }

  // Server interaction methods
  async saveAnnotationsToServer(): Promise<void> {
    try {
      await fetch(`http://localhost/videos/${this.videoData.id}/annotations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.annotations),
      });
    } catch (error) {
      console.error('Error saving annotations:', error);
      throw error;
    }
  }

  async loadSegmentationsFromServer(): Promise<void> {
    try {
      const response = await fetch(`http://localhost/videos/${this.videoData.id}/annotations`);
      const data = await response.json();
      this.annotations = data;
    } catch (error) {
      console.error('Error loading annotations:', error);
      throw error;
    }
  }
}

export default Video;
