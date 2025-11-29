import { Point, Joint } from '../types';

// Distance between two points
export const dist = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

// Find intersection of two circles
// Used for closing loops: given pivot A and pivot B, and lengths L1, L2
export const findCircleIntersection = (
  p1: Point,
  r1: number,
  p2: Point,
  r2: number,
  preferUpper: boolean = true
): Point | null => {
  const d = dist(p1, p2);

  // Circles too far apart or contained within each other
  if (d > r1 + r2 || d < Math.abs(r1 - r2) || d === 0) {
    return null;
  }

  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));

  const x2 = p1.x + (a * (p2.x - p1.x)) / d;
  const y2 = p1.y + (a * (p2.y - p1.y)) / d;

  const x3_1 = x2 + (h * (p2.y - p1.y)) / d;
  const y3_1 = y2 - (h * (p2.x - p1.x)) / d;

  const x3_2 = x2 - (h * (p2.y - p1.y)) / d;
  const y3_2 = y2 + (h * (p2.x - p1.x)) / d;

  // Selection logic for assembly mode (heuristic)
  if (preferUpper) {
    return y3_1 < y3_2 ? { x: x3_1, y: y3_1 } : { x: x3_2, y: y3_2 }; // SVG coords, y is down
  }
  return y3_1 > y3_2 ? { x: x3_1, y: y3_1 } : { x: x3_2, y: y3_2 };
};

// Return both intersections
export const findCircleCircleIntersections = (
  p1: Point, r1: number,
  p2: Point, r2: number
): [Point, Point] | null => {
  const d = dist(p1, p2);
  if (d > r1 + r2 || d < Math.abs(r1 - r2) || d === 0) return null;

  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));

  const x2 = p1.x + (a * (p2.x - p1.x)) / d;
  const y2 = p1.y + (a * (p2.y - p1.y)) / d;

  return [
    { x: x2 + (h * (p2.y - p1.y)) / d, y: y2 - (h * (p2.x - p1.x)) / d },
    { x: x2 - (h * (p2.y - p1.y)) / d, y: y2 + (h * (p2.x - p1.x)) / d }
  ];
};

// Calculate intersection of a circle and a line defined by a point and angle
export const findCircleLineIntersection = (
    circleCenter: Point,
    radius: number,
    linePoint: Point, 
    lineAngleRad: number
): Point | null => {
    // Transform circle center to line's local coords (rotated)
    // Line is x-axis in local.
    const dx = circleCenter.x - linePoint.x;
    const dy = circleCenter.y - linePoint.y;
    
    const cos = Math.cos(-lineAngleRad);
    const sin = Math.sin(-lineAngleRad);
    
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;
    
    // Circle equation in local: (x - localX)^2 + (y - localY)^2 = r^2
    // We want intersection with line y = 0.
    // (x - localX)^2 + (-localY)^2 = r^2
    // (x - localX)^2 = r^2 - localY^2
    
    const disc = radius * radius - localY * localY;
    if (disc < 0) return null;
    
    const root = Math.sqrt(disc);
    // Two roots: x1, x2. Choose one based on context? 
    // Usually for our sliders we want the one "forward" or consistent with configuration.
    // Let's try the one greater in x.
    const xSol = localX + root; 
    
    // Transform back to global
    const globalX = linePoint.x + xSol * Math.cos(lineAngleRad);
    const globalY = linePoint.y + xSol * Math.sin(lineAngleRad);
    
    return { x: globalX, y: globalY };
};

// Calculate the position of a 3rd point (p3) on a rigid body defined by p1 and p2.
// localCoords {x, y} defines p3 relative to p1, with p1->p2 as the local X axis.
export const getRigidPoint = (p1: Point, p2: Point, local: { x: number, y: number }): Point => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  
  if (len === 0) return p1;

  // Unit vector u along p1->p2
  const ux = dx / len;
  const uy = dy / len;

  // Unit vector v orthogonal to u (-uy, ux) for standard counter-clockwise y-up, 
  // but SVG is y-down. Let's stick to standard math rotation:
  // Rot 90 deg CCW: (x, y) -> (-y, x).
  const vx = -uy;
  const vy = ux;

  return {
    x: p1.x + local.x * ux + local.y * vx,
    y: p1.y + local.x * uy + local.y * vy
  };
};

export const toRad = (deg: number) => (deg * Math.PI) / 180;
export const toDeg = (rad: number) => (rad * 180) / Math.PI;