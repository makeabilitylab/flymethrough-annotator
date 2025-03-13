interface Point {
    x: number;
    y: number;
    type:number;//1 is positive, 0 is negative
  }

  interface BBox {
    frameIndex: number;
    annotation: Annotation;
    bbox: number[];
  }

class Annotation {
  private points: Point[];
  private mask: number[][]|null;
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
  constructor(initialFrame: number, annotationType: string, overallIndex: number, typeIndex: number, color: string) {
    this.points = [];
    this.mask = null;
    this.bboxes = [];
    this.annotationType = annotationType;
    this.overallIndex = overallIndex;
    this.typeIndex = typeIndex;
    this.annotationID = annotationType + "_" + typeIndex;
    this.timestamp = new Date();
    this.processed = false;
    this.initialFrame = initialFrame;
    this.color = color;
    this.processTime = 0;
    this.confirmed = false;
  }

  getInitialFrame(): number {
    return this.initialFrame;
  }

  addPoint(point: Point): void {
    this.points.push(point);
  }

  setPoints(points: Point[]): void {   
    this.points = points;
  }

  isValid(): boolean {
    return this.points.filter(point => point.type === 1).length > 0;
  }

  setMask(mask: number[][]): void {
    this.mask = mask;
  }

  getPositivePoints(): Point[] {
    return this.points.filter(point => point.type === 1);
  }

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
