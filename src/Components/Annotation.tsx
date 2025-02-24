interface Point {
  x: number;
  y: number;
}


class Annotation {
  private positivePoints: Point[];
  private negativePoints: Point[];
  private mask: number[][];
  private annotationType: string;
  private overallIndex: number;
  private typeIndex: number;
  private annotationID: string | null;
  private timestamp: Date;

  constructor(annotationType: string, overallIndex: number, typeIndex: number) {
    this.positivePoints = [];    
    this.negativePoints = []; 
    this.mask = [];
    this.annotationType = annotationType;
    this.overallIndex = overallIndex;
    this.typeIndex = typeIndex;
    this.annotationID = annotationType + "_" + typeIndex;
    this.timestamp = new Date();
  }

  addPositivePoint(x: number, y: number): void {
    this.positivePoints.push({x, y});
  }

  addNegativePoint(x: number, y: number): void {
    this.negativePoints.push({x, y});
  }

  clearPoints(): void {
    this.positivePoints = [];
    this.negativePoints = [];
  }

  isValid(): boolean {
    return this.positivePoints.length > 0;
  }

  setMask(mask: number[][]): void {
    this.mask = mask;
  }

  getPositivePoints(): Point[] {
    return [...this.positivePoints];
  }

  getNegativePoints(): Point[] {
    return [...this.negativePoints];
  }

  getMask(): number[][] {
    return [...this.mask];
  }

  getAnnotationType(): string {
    return this.annotationType;
  }

  getTimestamp(): Date {
    return this.timestamp;
  }

}

export default Annotation;
