import React from 'react';

export type JointType = 'R' | 'P' | 'Cam' | 'PinSlot';

export interface Point {
  x: number;
  y: number;
}

export interface Joint {
  id: string;
  type: JointType;
  x: number;
  y: number;
  ground?: boolean;
  angle?: number; // For sliders (orientation) or cams (rotation)
  isDriver?: boolean;
  // For sliders, the axis of sliding
  slideAxisAngle?: number; 
  connectivity?: number; // Degrees of freedom allowed by this joint (f_i)
}

export interface Link {
  id: string;
  joints: string[]; // IDs of joints connected by this link
  isGround?: boolean;
  color?: string;
  type?: 'binary' | 'ternary' | 'quaternary'; // For visualization logic
}

export interface Mechanism {
  id: string;
  name: string;
  description: string;
  links: Link[];
  joints: Joint[];
  
  // Mobility Analysis Properties
  expectedN: number;      // Number of links (n)
  expectedJ: number;      // Number of joints (j)
  expectedSumFi: number;  // Sum of joint connectivities (Σf_i)
  expectedM: number;      // Mobility (M)
  
  // Solver function to update joint positions based on parametric input
  solve?: (t: number, currentJoints: Joint[]) => Joint[];
}

export interface SimulationState {
  t: number; // Parametric time/angle
  isRunning: boolean;
  speed: number;
}

export interface StaticProblem {
  id: string;
  title: string; // e.g. "Problem 1.9"
  description: string;
  svgContent: React.ReactNode; // Schematic representation
  expectedN: number;
  expectedJ: number;
  expectedSumFi: number;
  expectedM: number;
  isSpatial?: boolean; // If true, use K=6
}