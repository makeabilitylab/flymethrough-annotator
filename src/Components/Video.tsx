// Core Video class - removed unused useState import
import Annotation from './Annotation';
import Bbox from './Annotation.tsx';

/**
 * Interface representing video metadata from the backend
 */
interface VideoData {
  name: string;
  image_count: number;
  image: string;
  frames: string[]; // Array of frame filenames
}


/**
 * Core Video class that manages video data, frames, annotations, and SAM encodings
 * Provides methods for frame navigation, annotation management, and data retrieval
 */
class Video {
  private videoData: VideoData;
  private frames: string[];
  private annotations: Annotation[];
  private currentFrameIndex: number;
  private bboxes: Bbox[];
  private encodings: { [frameIndex: number]: Float32Array } = {};

  /**
   * Creates a new Video instance
   * @param videoData - Video metadata including name, frame count, and frame list
   */
  constructor(videoData: VideoData) {
    this.videoData = videoData;
    this.annotations = [];
    this.frames = this.videoData.frames;
    this.bboxes = [];
    this.currentFrameIndex = 0;
  }

  // === Getters ===

  /**
   * Gets the video name
   */
  getName(): string {
    return this.videoData.name;
  }

  /**
   * Gets the total number of frames in the video
   */
  getImageCount(): number {
    return this.videoData.image_count;
  }

  /**
   * Gets the frame index for a given filename
   */
  getFrameIndex(filename: string): number {
    return this.frames.indexOf(filename);
  }

  /**
   * Gets the filename for a given frame index
   */
  getFrameFilename(index: number): string {
    return this.frames[index];
  }

  /**
   * Gets the URL for the video thumbnail
   */
  getThumbnail(): string {
    return `http://localhost/video_images_compressed/${this.videoData.name}/${this.videoData.image}`;
  }

  /**
   * Gets the URL for a compressed frame at the specified index
   * @param index - Frame index (0-based)
   * @throws Error if index is out of bounds
   */
  getCompressedFrame(index: number): string {
    if (index >= 0 && index < this.frames.length) {
      return `http://localhost/video_images_compressed/${this.videoData.name}/${this.frames[index]}`;
    }
    throw new Error('Frame index out of bounds');
  }

  /**
   * Gets the URL for a raw (uncompressed) frame at the specified index
   * @param index - Frame index (0-based)
   * @throws Error if index is out of bounds
   */
  getRawFrame(index: number): string {
    if (index >= 0 && index < this.frames.length) {
      return `http://localhost/video_images_raw/${this.videoData.name}/${this.frames[index]}`;
    }
    throw new Error('Frame index out of bounds');
  }

  /**
   * Gets URLs for all compressed frames
   */
  getCompressedFrames(): string[] {
    return this.frames.map(frame => 
      `http://localhost/video_images_compressed/${this.videoData.name}/${frame}`
    );
  }

  /**
   * Gets URLs for all raw (uncompressed) frames
   */
  getRawFrames(): string[] {
    return this.frames.map(frame => 
      `http://localhost/video_images_raw/${this.videoData.name}/${frame}`
    );
  }

  // === Frame Navigation ===

  /**
   * Sets the current frame index
   * @param index - Frame index to set (0-based)
   */
  setCurrentFrame(index: number): void {
    if (index >= 0 && index < this.videoData.image_count) {
      this.currentFrameIndex = index;
    }
  }

  /**
   * Stores SAM encoder output for a specific frame
   * @param index - Frame index
   * @param encoding - SAM encoder output
   */
  setEncoding(index: number, encoding: Float32Array): void {
    this.encodings[index] = encoding;
  }

  /**
   * Retrieves SAM encoding for a specific frame
   * @param index - Frame index
   * @returns SAM encoding or null if not found
   */
  getEncoding(index: number): Float32Array | null {
    if (!this.encodings[index]) return null;
    return this.encodings[index];
  }

  // === Annotation Management ===

  /**
   * Adds a new annotation to the video
   * @param annotation - Annotation instance to add
   */
  addAnnotation(annotation: Annotation): void {
    this.annotations.push(annotation);
  }

  /**
   * Gets all annotations for this video
   * @returns Copy of annotations array
   */
  getAllAnnotations(): Annotation[] {
    return [...this.annotations];
  }

  /**
   * Gets annotations with a specific object ID
   * @param objectId - Object ID to filter by
   */
  getAnnotationsByObjectID(objectId: string): Annotation[] {
    return this.annotations.filter(a => a.getId() === objectId);
  }

  /**
   * Gets all annotations for a specific frame
   * @param frameIndex - Frame index to filter by
   */
  getAnnotationsForFrame(frameIndex: number): Annotation[] {
    return this.annotations.filter(a => a.getInitialFrame() === frameIndex);
  }

  /**
   * Adds a bounding box to an annotation for a specific frame
   * @param frameIndex - Frame index where the bbox appears
   * @param objectId - Object ID of the annotation
   * @param bbox - Bounding box coordinates [x1, y1, x2, y2] in normalized coordinates
   */
  addBBoxToAnnotation(frameIndex: number, objectId: string, bbox: number[]): void {
    const annotation = this.annotations.find(a => a.getId() === objectId);
    if (annotation) {
      annotation.addBBox(frameIndex, bbox);
      this.bboxes.push({frameIndex, annotation, bbox});
      console.log('Added bbox to annotation:', {frameIndex, objectId, bbox});
    }
  }

  /**
   * Gets all SAM-generated bounding boxes for a specific frame
   * @param frameIndex - Frame index to filter by
   * @returns Array of bounding boxes for the frame
   */
  getSAMResultsByFrame(frameIndex: number): Bbox[] {
    return this.bboxes.filter(b => b.frameIndex === frameIndex);
  }
}

export default Video;
