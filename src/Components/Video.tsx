import { useState } from 'react';
import Annotation from './Annotation';
import Bbox from './Annotation.tsx';

interface VideoData {
  name: string;
  image_count: number;
  image: string;
}


class Video {
  private videoData: VideoData;
  private frames: string[];
  private annotations: Annotation[];
  private currentFrameIndex: number;
  private bboxes: Bbox[];
  private encodings: { [frameIndex: number]: Float32Array } = {};

  constructor(videoData: VideoData) {
    this.videoData = videoData;
    this.annotations = [];
    this.frames = this.videoData.frames;
    this.bboxes = [];
    this.currentFrameIndex = 0;
  }

  // Getters

  getName(): string {
    return this.videoData.name;
  }

  getImageCount(): number {
    return this.videoData.image_count;
  }

  getFrameIndex(filename: string): number {
    return this.frames.indexOf(filename);
  }

  getFrameFilename(index: number): string {
    return this.frames[index];
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


  getAllAnnotations(): Annotation[] {
    return [...this.annotations];
  }

  getAnnotationsByObjectID(objectId: string): Annotation[] {
    return this.annotations.filter(a => a.getId() === objectId);
  }

  getAnnotationsForFrame(frameIndex: number): Annotation[] {
    return this.annotations.filter(a => a.frameIndex === frameIndex);
  }

  addBBoxToAnnotation(frameIndex: number, objectId: string, bbox: number[]): void {
    const annotation = this.annotations.find(a => a.getId() === objectId);
    if (annotation) {
      annotation.addBBox(frameIndex, bbox);
      //console.log("Added bbox to annotation: ", annotation);
      this.bboxes.push({frameIndex, annotation, bbox});
      console.log("Added bbox to bboxes: ", this.bboxes);
    }
  }

  getSAMResultsByFrame(frameIndex: number): Bbox[] {
    return this.bboxes.filter(b => b.frameIndex === frameIndex);
  }
}

export default Video;
