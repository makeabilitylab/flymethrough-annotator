interface Point {
    x: number;
    y: number;
    type:number;//1 is positive, 0 is negative
  }

class Annotation {
  private points: Point[];
  private mask: number[][]|null;
  private annotationType: string;
  private overallIndex: number;
  private typeIndex: number;
  private annotationID: string | null;
  private timestamp: Date;

  constructor(annotationType: string, overallIndex: number, typeIndex: number) {
    this.points = [];
    this.mask = null;
    this.annotationType = annotationType;
    this.overallIndex = overallIndex;
    this.typeIndex = typeIndex;
    this.annotationID = annotationType + "_" + typeIndex;
    this.timestamp = new Date();
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

}

export default Annotation;
