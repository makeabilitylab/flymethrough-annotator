/**
 * Represents a point annotation with coordinates and type
 */
interface Point {
  x: number;
  y: number;
  type: number; // 1 is positive, 0 is negative
}

/**
 * Represents a bounding box annotation for a specific frame
 */
interface BBox {
  frameIndex: number;
  annotation: Annotation;
  bbox: number[]; // [x1, y1, x2, y2] in normalized coordinates (0-1)
}

/**
 * Core annotation class that represents a single annotation instance
 * with associated points, masks, bounding boxes, and metadata
 */
class Annotation {
  private points: Point[];
  private mask: number[][] | null;
  private bboxes: BBox[];
  private annotationType: string;
  private overallIndex: number;
  private typeIndex: number;
  private annotationID: string | null;
  private timestamp: Date;
  private processed: boolean;
  private confirmed: boolean;
  private initialFrame: number;
  private color: string;
  private processTime: number;
  /**
   * Creates a new annotation instance
   * @param initialFrame - The frame index where this annotation was created
   * @param annotationType - Type of annotation (e.g., 'object', 'person', etc.)
   * @param overallIndex - Global index across all annotations
   * @param typeIndex - Index within the specific annotation type
   * @param color - Display color for this annotation
   */
  constructor(
    initialFrame: number,
    annotationType: string,
    overallIndex: number,
    typeIndex: number,
    color: string
  ) {
    this.points = [];
    this.mask = null;
    this.bboxes = [];
    this.annotationType = annotationType;
    this.overallIndex = overallIndex;
    this.typeIndex = typeIndex;
    this.annotationID = `${annotationType}_${typeIndex}`;
    this.timestamp = new Date();
    this.processed = false;
    this.initialFrame = initialFrame;
    this.color = color;
    this.processTime = 0;
    this.confirmed = false;
  }

  /**
   * Gets the initial frame where this annotation was created
   */
  getInitialFrame(): number {
    return this.initialFrame;
  }

  /**
   * Adds a point to this annotation
   */
  addPoint(point: Point): void {
    this.points.push(point);
  }

  /**
   * Sets all points for this annotation
   */
  setPoints(points: Point[]): void {
    this.points = points;
  }

  /**
   * Checks if annotation is valid (has at least one positive point)
   */
  isValid(): boolean {
    return this.points.filter(point => point.type === 1).length > 0;
  }

  /**
   * Sets the segmentation mask for this annotation
   */
  setMask(mask: number[][]): void {
    this.mask = mask;
  }

  /**
   * Gets all positive (foreground) points
   */
  getPositivePoints(): Point[] {
    return this.points.filter(point => point.type === 1);
  }

  /**
   * Gets all negative (background) points
   */
  getNegativePoints(): Point[] {
    return this.points.filter(point => point.type === 0);
  }

  getMask(): number[][] | null {
    return this.mask;
  }

  getAnnotationType(): string {
    return this.annotationType;
  }

  getTimestamp(): Date {
    return this.timestamp;
  }

  getId(): string | null {
    return this.annotationID;
  }
  getType(): string {
    return this.annotationType;
  }

  addBBox(frameIndex: number, bbox: number[]): void {
    this.bboxes.push({frameIndex, annotation: this, bbox});
  }

  getBBoxes(): BBox[] {
    return this.bboxes;
  }

  setProcessed(processed: boolean): void {
    this.processed = processed;
  }

  isProcessed(): boolean {
    return this.processed;
  }

  setProcessTime(processTime: number): void {
    this.processTime = processTime;
  }

  getProcessTime(): number {
    return this.processTime;
  }

  setConfirmed(confirmed: boolean): void {
    this.confirmed = confirmed;
  }

  isConfirmed(): boolean {
    return this.confirmed;
  }
}

export default Annotation;
