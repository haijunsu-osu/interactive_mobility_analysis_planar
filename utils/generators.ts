import { Mechanism, Joint, Link } from '../types';
import { findCircleIntersection, getRigidPoint, findCircleLineIntersection, findCircleCircleIntersections, dist } from './geometry';

// Helper to jitter points slightly so problems look different
const jitter = (val: number, range: number = 20) => val + (Math.random() * range - range / 2);

export const generateFourBar = (): Mechanism => {
  const Ax = jitter(150), Ay = jitter(300);
  const Dx = jitter(450), Dy = jitter(300); 
  const crankLen = 60 + Math.random() * 20; 
  const couplerLen = 200 + Math.random() * 50;
  const rockerLen = 150 + Math.random() * 50;

  const joints: Joint[] = [
    { id: 'J1', type: 'R', x: Ax, y: Ay, ground: true, isDriver: true, connectivity: 1 },
    { id: 'J2', type: 'R', x: Ax, y: Ay - crankLen, connectivity: 1 }, 
    { id: 'J3', type: 'R', x: Dx, y: Dy - rockerLen, connectivity: 1 }, 
    { id: 'J4', type: 'R', x: Dx, y: Dy, ground: true, connectivity: 1 },
  ];

  const links: Link[] = [
    { id: 'L1', joints: ['J1', 'J4'], isGround: true, type: 'binary' },
    { id: 'L2', joints: ['J1', 'J2'], type: 'binary' }, 
    { id: 'L3', joints: ['J2', 'J3'], type: 'binary' }, 
    { id: 'L4', joints: ['J3', 'J4'], type: 'binary' }, 
  ];

  return {
    id: 'four_bar_' + Date.now(),
    name: 'Four-Bar Linkage',
    description: 'A fundamental planar linkage. All joints are Revolute (R) with 1 degree of freedom.',
    links,
    joints,
    expectedN: 4,
    expectedJ: 4,
    expectedSumFi: 4, 
    expectedM: 1,     
    solve: (angleRad: number, currentJoints) => {
       const j1 = currentJoints.find(j => j.id === 'J1')!;
       const j4 = currentJoints.find(j => j.id === 'J4')!;
       
       const Bx_new = j1.x + crankLen * Math.cos(angleRad);
       const By_new = j1.y + crankLen * Math.sin(angleRad);
       
       const C_new = findCircleIntersection(
         { x: Bx_new, y: By_new }, couplerLen,
         { x: j4.x, y: j4.y }, rockerLen,
         true 
       );

       if (!C_new) return currentJoints; 

       return currentJoints.map(j => {
         if (j.id === 'J2') return { ...j, x: Bx_new, y: By_new };
         if (j.id === 'J3') return { ...j, x: C_new.x, y: C_new.y };
         return j;
       });
    }
  };
};

export const generateWaterPump = (): Mechanism => {
    // Problem 1.6 Water Pump
    // Vertical slider crank
    const Ax = 250, Ay = 100; // Crank pivot
    const crankLen = 60;
    const couplerLen = 220;
    const pistonX = 250;
    
    // Offset? In problem 1.6 it looks offset or vertical aligned. Let's align.
    
    const joints: Joint[] = [
        { id: 'J1', type: 'R', x: Ax, y: Ay, ground: true, isDriver: true, connectivity: 1 }, // Crank Pivot
        { id: 'J2', type: 'R', x: Ax + crankLen, y: Ay, connectivity: 1 }, // Crank Pin
        { id: 'J3', type: 'R', x: pistonX, y: Ay + 200, connectivity: 1 }, // Piston Pin
        { id: 'J4', type: 'P', x: pistonX, y: Ay + 200, ground: true, slideAxisAngle: 90, connectivity: 1 } // Piston Sliding Ground
    ];
    
    const links: Link[] = [
        { id: 'L1', joints: ['J1', 'J4'], isGround: true }, // Ground
        { id: 'L2', joints: ['J1', 'J2'], type: 'binary' }, // Crank
        { id: 'L3', joints: ['J2', 'J3'], type: 'binary' }, // Coupler
        { id: 'L4', joints: ['J3', 'J4'], type: 'binary', color: '#60a5fa' }, // Piston
    ];

    return {
        id: 'water_pump_' + Date.now(),
        name: 'Water Pump (Prob 1.6)',
        description: 'Vertical Slider-Crank mechanism. n=4, j=4, M=1.',
        links,
        joints,
        expectedN: 4,
        expectedJ: 4,
        expectedSumFi: 4,
        expectedM: 1,
        solve: (t: number, currentJoints) => {
            const j1 = currentJoints.find(j => j.id === 'J1')!;
            
            const j2x = j1.x + crankLen * Math.cos(t);
            const j2y = j1.y + crankLen * Math.sin(t);
            
            // Slider constrained to x = pistonX
            const intersect = findCircleLineIntersection(
                { x: j2x, y: j2y }, couplerLen, 
                { x: pistonX, y: 0 }, Math.PI/2
            );
            
            if (!intersect) return currentJoints;
            // Prefer lower solution for pump
            // findCircleLineIntersection usually returns one? It returns 'forward' one.
            // For vertical line, we might get two y values. 
            // Our helper returns one. Let's assume it works or we refine.
            // Actually, for vertical slider, geometric simple math:
            const dx = pistonX - j2x;
            const dySq = couplerLen * couplerLen - dx * dx;
            if (dySq < 0) return currentJoints;
            const j3y = j2y + Math.sqrt(dySq); // Downward pump

            return currentJoints.map(j => {
                if (j.id === 'J2') return { ...j, x: j2x, y: j2y };
                if (j.id === 'J3') return { ...j, x: pistonX, y: j3y };
                if (j.id === 'J4') return { ...j, x: pistonX, y: j3y };
                return j;
            });
        }
    };
};

export const generateFoldingChair = (): Mechanism => {
    // Problem 1.6 Folding Chair (Pin-in-Slot)
    // Link 1: Ground (Floor)
    // Link 2: Backrest (Pivots on floor)
    // Link 3: Seat/Leg (Pivots on floor, Slot connects to Backrest)
    // n=3, j=3 (R, R, PinSlot). M = 3(3-3-1) + (1+1+2) = 1.
    
    const Ax = 200, Ay = 400; // Backrest pivot
    const Bx = 350, Ay2 = 400; // Seat pivot
    
    const joints: Joint[] = [
        { id: 'J1', type: 'R', x: Ax, y: Ay, ground: true, isDriver: true, connectivity: 1 }, // Backrest Pivot
        { id: 'J2', type: 'PinSlot', x: Ax, y: Ay - 150, connectivity: 2 }, // Pin on Backrest, Slot on Seat
        { id: 'J3', type: 'R', x: Bx, y: Ay2, ground: true, connectivity: 1 }, // Seat Pivot
    ];
    
    const links: Link[] = [
        { id: 'L1', joints: ['J1', 'J3'], isGround: true },
        { id: 'L2', joints: ['J1', 'J2'], type: 'binary', color: '#f87171' }, // Backrest
        { id: 'L3', joints: ['J3', 'J2'], type: 'binary', color: '#60a5fa' }, // Seat (Visualized to pin)
    ];

    return {
        id: 'folding_chair_' + Date.now(),
        name: 'Folding Chair (Prob 1.6)',
        description: '3-link mechanism with Pin-in-Slot joint (f=2). n=3, j=3, sum(fi)=4, M=1.',
        links,
        joints,
        expectedN: 3,
        expectedJ: 3,
        expectedSumFi: 4,
        expectedM: 1,
        solve: (t: number, currentJoints) => {
            const j1 = currentJoints.find(j => j.id === 'J1')!;
            const j3 = currentJoints.find(j => j.id === 'J3')!;
            
            // Driver is Backrest angle (t)
            // Range limited visually, but Math is fine 0-360
            // Oscillation desirable for chair
            const angle = -Math.PI/3 + 0.5 * Math.sin(t); 
            const pinDist = 150;
            
            const pinX = j1.x + pinDist * Math.cos(angle);
            const pinY = j1.y + pinDist * Math.sin(angle);
            
            // Calculate Seat Angle (L3 passes through J3 and Pin J2)
            const dx = pinX - j3.x;
            const dy = pinY - j3.y;
            const seatAngle = Math.atan2(dy, dx);
            
            // For PinSlot joint, angle prop represents slot orientation (seat angle)
            return currentJoints.map(j => {
                if (j.id === 'J2') return { ...j, x: pinX, y: pinY, angle: seatAngle };
                return j;
            });
        }
    };
};

export const generateHydraulicLift = (): Mechanism => {
    // Problem 1.12 / 1.14 (Hydraulic Cylinder)
    // Ground -> Boom (Rocker) driven by Cylinder.
    // Cylinder is effectively two links (Cyl + Piston) connected by P joint.
    // Ground -> Cyl (R) -> Piston (P) -> Boom (R) -> Ground (R).
    // This is an Inverted Slider-Crank.
    // n=4 (G, Boom, Cyl, Piston). j=4 (R, R, R, P). M=1.
    
    const G_BoomX = 400, G_BoomY = 350;
    const G_CylX = 250, G_CylY = 350;
    
    const boomLen = 200;
    
    const joints: Joint[] = [
        { id: 'J1', type: 'R', x: G_BoomX, y: G_BoomY, ground: true, connectivity: 1 }, // Boom Pivot
        { id: 'J2', type: 'R', x: G_CylX, y: G_CylY, ground: true, connectivity: 1 }, // Cyl Pivot
        { id: 'J3', type: 'P', x: 300, y: 300, connectivity: 1 }, // Piston-Cyl sliding connection
        { id: 'J4', type: 'R', x: 350, y: 250, isDriver: true, connectivity: 1 }, // Piston-Boom connection
    ];
    
    const links: Link[] = [
        { id: 'L1', joints: ['J1', 'J2'], isGround: true },
        { id: 'L2', joints: ['J1', 'J4'], type: 'binary', color: '#fcd34d' }, // Boom
        { id: 'L3', joints: ['J2', 'J3'], type: 'binary', color: '#94a3b8' }, // Cylinder Body
        { id: 'L4', joints: ['J3', 'J4'], type: 'binary', color: '#64748b' }, // Piston Rod
    ];

    return {
        id: 'hydraulic_lift_' + Date.now(),
        name: 'Hydraulic Lift (Prob 1.12)',
        description: 'Inverted Slider-Crank (Cylinder). Piston/Cyl are 2 links. n=4, j=4 (3R, 1P).',
        links,
        joints,
        expectedN: 4,
        expectedJ: 4,
        expectedSumFi: 4,
        expectedM: 1,
        solve: (t: number, currentJoints) => {
            const j1 = currentJoints.find(j => j.id === 'J1')!;
            const j2 = currentJoints.find(j => j.id === 'J2')!;
            
            // Driver: Boom Angle
            const boomAngle = -Math.PI/2 - Math.PI/6 + 0.5 * Math.sin(t);
            const mountDist = 100; // Distance from Boom pivot to Piston connection
            
            const j4x = j1.x + mountDist * Math.cos(boomAngle);
            const j4y = j1.y + mountDist * Math.sin(boomAngle);
            
            // J3 (Cylinder/Piston interface) is along the line J2-J4
            // We visualize J3 somewhere in middle
            const cylAngle = Math.atan2(j4y - j2.y, j4x - j2.x);
            const cylLen = Math.sqrt(Math.pow(j4x - j2.x, 2) + Math.pow(j4y - j2.y, 2));
            
            const j3x = j2.x + (cylLen * 0.6) * Math.cos(cylAngle);
            const j3y = j2.y + (cylLen * 0.6) * Math.sin(cylAngle);

            return currentJoints.map(j => {
                if (j.id === 'J4') return { ...j, x: j4x, y: j4y };
                if (j.id === 'J3') return { ...j, x: j3x, y: j3y, slideAxisAngle: -cylAngle * 180 / Math.PI }; // Align visual block
                return j;
            });
        }
    };
};

export const generateEllipticalTrainer = (): Mechanism => {
    // Problem 1.7 Elliptical Trainer
    // Slider-Crank with long coupler extended backwards
    // Rear Crank, Coupler (Pedal), Front Slider (Roller)
    
    const crankX = 150, crankY = 350;
    const trackY = 400;
    const crankLen = 50;
    const couplerLen = 300; 
    
    const joints: Joint[] = [
        { id: 'J1', type: 'R', x: crankX, y: crankY, ground: true, isDriver: true, connectivity: 1 },
        { id: 'J2', type: 'R', x: crankX, y: crankY-crankLen, connectivity: 1 },
        { id: 'J3', type: 'R', x: crankX+200, y: trackY, connectivity: 1 }, // Pedal/Roller joint
        { id: 'J4', type: 'P', x: crankX+200, y: trackY, ground: true, slideAxisAngle: 0, connectivity: 1 },
    ];
    
    const links: Link[] = [
        { id: 'L1', joints: ['J1', 'J4'], isGround: true },
        { id: 'L2', joints: ['J1', 'J2'], type: 'binary' }, // Crank
        { id: 'L3', joints: ['J2', 'J3'], type: 'binary', color: '#10b981' }, // Pedal Arm
    ];

    return {
        id: 'elliptical_' + Date.now(),
        name: 'Elliptical Trainer (Prob 1.7)',
        description: 'Slider-Crank mechanism. Coupler (green) creates elliptical motion for foot.',
        links,
        joints,
        expectedN: 4,
        expectedJ: 4,
        expectedSumFi: 4,
        expectedM: 1,
        solve: (t: number, currentJoints) => {
            const j1 = currentJoints.find(j => j.id === 'J1')!;
            
            const j2x = j1.x + crankLen * Math.cos(t);
            const j2y = j1.y + crankLen * Math.sin(t);
            
            const dy = trackY - j2y;
            const dx = Math.sqrt(couplerLen*couplerLen - dy*dy);
            const j3x = j2x + dx; 
            
            return currentJoints.map(j => {
                if (j.id === 'J2') return { ...j, x: j2x, y: j2y };
                if (j.id === 'J3') return { ...j, x: j3x, y: trackY };
                if (j.id === 'J4') return { ...j, x: j3x, y: trackY };
                return j;
            });
        }
    };
};

export const generateParallelogram = (): Mechanism => {
    // Problem 1.5 Parallelogram Linkage
    // Used in table saw guards, drawing boards.
    // Crank-Rocker/Double-Crank where s=p, l=q.
    
    const Ax = 200, Ay = 300;
    const Dx = 400, Dy = 300;
    const crankLen = 100;
    const couplerLen = 200;
    
    const joints: Joint[] = [
        { id: 'J1', type: 'R', x: Ax, y: Ay, ground: true, isDriver: true, connectivity: 1 },
        { id: 'J2', type: 'R', x: Ax, y: Ay-crankLen, connectivity: 1 },
        { id: 'J3', type: 'R', x: Dx, y: Dy-crankLen, connectivity: 1 },
        { id: 'J4', type: 'R', x: Dx, y: Dy, ground: true, connectivity: 1 },
    ];
    
    const links: Link[] = [
        { id: 'L1', joints: ['J1', 'J4'], isGround: true },
        { id: 'L2', joints: ['J1', 'J2'], type: 'binary' },
        { id: 'L3', joints: ['J2', 'J3'], type: 'binary' },
        { id: 'L4', joints: ['J3', 'J4'], type: 'binary' },
    ];

    return {
        id: 'parallel_' + Date.now(),
        name: 'Parallelogram Linkage (Prob 1.5)',
        description: 'Parallel motion mechanism. Coupler stays parallel to ground.',
        links,
        joints,
        expectedN: 4,
        expectedJ: 4,
        expectedSumFi: 4,
        expectedM: 1,
        solve: (t: number, currentJoints) => {
            const j1 = currentJoints.find(j => j.id === 'J1')!;
            const j4 = currentJoints.find(j => j.id === 'J4')!;
            
            const j2x = j1.x + crankLen * Math.cos(t);
            const j2y = j1.y + crankLen * Math.sin(t);
            
            const j3x = j4.x + crankLen * Math.cos(t);
            const j3y = j4.y + crankLen * Math.sin(t);
            
            return currentJoints.map(j => {
                if (j.id === 'J2') return { ...j, x: j2x, y: j2y };
                if (j.id === 'J3') return { ...j, x: j3x, y: j3y };
                return j;
            });
        }
    };
};

export const generateWattLinkage = (): Mechanism => {
    // Problem 1.2 Cabinet Hinge (Watt's Linkage)
    // Double Rocker where coupler midpoint traces straight line
    // Symmetrical 4-bar
    
    const Ax = 150, Ay = 250;
    const Dx = 450, Dy = 250;
    const crankLen = 120;
    const couplerLen = 100;
    
    const joints: Joint[] = [
        { id: 'J1', type: 'R', x: Ax, y: Ay, ground: true, isDriver: true, connectivity: 1 },
        { id: 'J2', type: 'R', x: Ax+crankLen, y: Ay, connectivity: 1 },
        { id: 'J3', type: 'R', x: Dx-crankLen, y: Dy, connectivity: 1 },
        { id: 'J4', type: 'R', x: Dx, y: Dy, ground: true, connectivity: 1 },
    ];
    
    const links: Link[] = [
        { id: 'L1', joints: ['J1', 'J4'], isGround: true },
        { id: 'L2', joints: ['J1', 'J2'], type: 'binary' },
        { id: 'L3', joints: ['J2', 'J3'], type: 'binary' },
        { id: 'L4', joints: ['J3', 'J4'], type: 'binary' },
    ];

    return {
        id: 'watt_link_' + Date.now(),
        name: 'Watt Straight Line (Prob 1.2)',
        description: 'Double-rocker mechanism used in cabinet hinges. Midpoint traces approx straight line.',
        links,
        joints,
        expectedN: 4,
        expectedJ: 4,
        expectedSumFi: 4,
        expectedM: 1,
        solve: (t: number, currentJoints) => {
            // Limited oscillation
            const angle = -0.5 + 0.8 * Math.sin(t);
            
            const j1 = currentJoints.find(j => j.id === 'J1')!;
            const j4 = currentJoints.find(j => j.id === 'J4')!;
            
            const j2x = j1.x + crankLen * Math.cos(angle);
            const j2y = j1.y + crankLen * Math.sin(angle);
            
            // J3 via circle intersection
            // Watt's linkage usually crosses. 
            // findCircleCircleIntersections returns 2 points. We need the "crossed" one.
            // Standard config: Ax<Dx. J2 right of J1. J3 left of J4. 
            // Coupler crosses the midline.
            
            const intersections = findCircleCircleIntersections(
                { x: j2x, y: j2y }, couplerLen,
                { x: j4.x, y: j4.y }, crankLen
            );
            
            if (!intersections) return currentJoints;
            
            // Heuristic for crossed configuration: Pick the one with Y larger (lower) or smaller?
            // Or pick based on x position relative to midpoint.
            // Let's try picking the one with smaller Y (upper) since simulation starts there?
            // Actually, visually check:
            const j3 = intersections[0]; 
            
            return currentJoints.map(j => {
                if (j.id === 'J2') return { ...j, x: j2x, y: j2y };
                if (j.id === 'J3') return { ...j, x: j3.x, y: j3.y };
                return j;
            });
        }
    };
};

export const generateWattSixBar = (): Mechanism => {
    const Ax = 100, Ay = 300; 
    const Bx = 250, By = 300; 
    const Cx = 400, Cy = 300; 
    
    const L2_len = 50;  
    const L3_len = 140; 
    const L4_J4J3_len = 80; 
    const L4_J4J5_len = 70; 
    const L4_angle_offset = 1.0; 
    
    const L5_len = 140; 
    const L6_len = 80;  
    
    const ternaryLocalJ5 = {
        x: L4_J4J5_len * Math.cos(L4_angle_offset),
        y: L4_J4J5_len * Math.sin(L4_angle_offset)
    };

    const joints: Joint[] = [
        { id: 'J1', type: 'R', x: Ax, y: Ay, ground: true, isDriver: true, connectivity: 1 },
        { id: 'J2', type: 'R', x: Ax, y: Ay-L2_len, connectivity: 1 },
        { id: 'J3', type: 'R', x: Bx, y: By-L4_J4J3_len, connectivity: 1 },
        { id: 'J4', type: 'R', x: Bx, y: By, ground: true, connectivity: 1 },
        { id: 'J5', type: 'R', x: Bx+10, y: By-50, connectivity: 1 }, 
        { id: 'J6', type: 'R', x: Cx, y: Cy-L6_len, connectivity: 1 },
        { id: 'J7', type: 'R', x: Cx, y: Cy, ground: true, connectivity: 1 },
    ];

    const links: Link[] = [
        { id: 'L1', joints: ['J1', 'J4', 'J7'], isGround: true, type: 'ternary' }, 
        { id: 'L2', joints: ['J1', 'J2'], type: 'binary' },
        { id: 'L3', joints: ['J2', 'J3'], type: 'binary' },
        { id: 'L4', joints: ['J4', 'J3', 'J5'], type: 'ternary', color: '#fcd34d' }, 
        { id: 'L5', joints: ['J5', 'J6'], type: 'binary' },
        { id: 'L6', joints: ['J6', 'J7'], type: 'binary' },
    ];

    return {
        id: 'watt_six_' + Date.now(),
        name: 'Watt II Six-Bar Linkage',
        description: 'Two four-bar linkages in series. Includes a ternary link (yellow) pivoting on ground.',
        links,
        joints,
        expectedN: 6,
        expectedJ: 7,
        expectedSumFi: 7,
        expectedM: 1, 
        solve: (t: number, currentJoints) => {
            const j1 = currentJoints.find(j => j.id === 'J1')!;
            const j4 = currentJoints.find(j => j.id === 'J4')!;
            const j7 = currentJoints.find(j => j.id === 'J7')!;
            
            const J2_new = { x: j1.x + L2_len * Math.cos(t), y: j1.y + L2_len * Math.sin(t) };
            
            const J3_new = findCircleIntersection(J2_new, L3_len, j4, L4_J4J3_len, true);
            if (!J3_new) return currentJoints;

            const J5_new = getRigidPoint(j4, J3_new, ternaryLocalJ5);

            const J6_new = findCircleIntersection(J5_new, L5_len, j7, L6_len, true);
            if (!J6_new) return currentJoints;

            return currentJoints.map(j => {
                if (j.id === 'J2') return { ...j, x: J2_new.x, y: J2_new.y };
                if (j.id === 'J3') return { ...j, x: J3_new.x, y: J3_new.y };
                if (j.id === 'J5') return { ...j, x: J5_new.x, y: J5_new.y };
                if (j.id === 'J6') return { ...j, x: J6_new.x, y: J6_new.y };
                return j;
            });
        }
    }
}

export const generateStephensonSixBar = (): Mechanism => {
    const Ax = 150, Ay = 300; 
    const Bx = 350, By = 300; 
    const Cx = 500, Cy = 200; 
    
    const L2_len = 60; 
    const L3_J2J3_len = 220; 
    const L4_len = 120; 
    const L3_J2J5_len = 100;
    const L3_angle_offset = -0.5; 
    const ternaryLocalJ5 = {
         x: L3_J2J5_len * Math.cos(L3_angle_offset),
         y: L3_J2J5_len * Math.sin(L3_angle_offset)
    };

    const L5_len = 180;
    const L6_len = 100;

    const joints: Joint[] = [
        { id: 'J1', type: 'R', x: Ax, y: Ay, ground: true, isDriver: true, connectivity: 1 },
        { id: 'J2', type: 'R', x: Ax, y: Ay-L2_len, connectivity: 1 },
        { id: 'J3', type: 'R', x: Bx, y: By-L4_len, connectivity: 1 },
        { id: 'J4', type: 'R', x: Bx, y: By, ground: true, connectivity: 1 },
        { id: 'J5', type: 'R', x: Ax+100, y: Ay-150, connectivity: 1 }, 
        { id: 'J6', type: 'R', x: Cx, y: Cy-L6_len, connectivity: 1 },
        { id: 'J7', type: 'R', x: Cx, y: Cy, ground: true, connectivity: 1 },
    ];

    const links: Link[] = [
        { id: 'L1', joints: ['J1', 'J4', 'J7'], isGround: true, type: 'ternary' },
        { id: 'L2', joints: ['J1', 'J2'], type: 'binary' },
        { id: 'L3', joints: ['J2', 'J3', 'J5'], type: 'ternary', color: '#fcd34d' }, 
        { id: 'L4', joints: ['J3', 'J4'], type: 'binary' },
        { id: 'L5', joints: ['J5', 'J6'], type: 'binary' },
        { id: 'L6', joints: ['J6', 'J7'], type: 'binary' },
    ];

    return {
        id: 'stephenson_six_' + Date.now(),
        name: 'Stephenson III Six-Bar',
        description: 'A 6-bar linkage where the ternary link (yellow) is a floating coupler.',
        links,
        joints,
        expectedN: 6,
        expectedJ: 7,
        expectedSumFi: 7,
        expectedM: 1,
        solve: (t: number, currentJoints) => {
            const j1 = currentJoints.find(j => j.id === 'J1')!;
            const j4 = currentJoints.find(j => j.id === 'J4')!;
            const j7 = currentJoints.find(j => j.id === 'J7')!;

            const J2_new = { x: j1.x + L2_len * Math.cos(t), y: j1.y + L2_len * Math.sin(t) };
            const J3_new = findCircleIntersection(J2_new, L3_J2J3_len, j4, L4_len, true);
            if (!J3_new) return currentJoints;
            const J5_new = getRigidPoint(J2_new, J3_new, ternaryLocalJ5);
            const J6_new = findCircleIntersection(J5_new, L5_len, j7, L6_len, true);
            if (!J6_new) return currentJoints;

            return currentJoints.map(j => {
                if (j.id === 'J2') return { ...j, x: J2_new.x, y: J2_new.y };
                if (j.id === 'J3') return { ...j, x: J3_new.x, y: J3_new.y };
                if (j.id === 'J5') return { ...j, x: J5_new.x, y: J5_new.y };
                if (j.id === 'J6') return { ...j, x: J6_new.x, y: J6_new.y };
                return j;
            });
        }
    }
}

export const generateScotchYoke = (): Mechanism => {
    // Scotch Yoke: Converts rotary to linear motion (simple harmonic)
    // Links: Ground(1), Crank(2), Yoke(3)
    // Joints: G-Crank(R), G-Yoke(P), Crank-Yoke(PinSlot, f=2)
    // n=3, j=3 (1,1,1), sumFi = 1+1+2=4. M = 3(3-3-1) + 4 = 1.
    
    const Ax = 200, Ay = 250;
    const crankLen = 80;
    
    const joints: Joint[] = [
        { id: 'J1', type: 'R', x: Ax, y: Ay, ground: true, isDriver: true, connectivity: 1 },
        { id: 'J2', type: 'PinSlot', x: Ax + crankLen, y: Ay, connectivity: 2, angle: 90 }, // Pin on Crank, Slot in Yoke (Vertical slot)
        { id: 'J3', type: 'P', x: Ax + crankLen + 100, y: Ay, ground: true, slideAxisAngle: 0, connectivity: 1 } // Yoke sliding on ground
    ];
    
    const links: Link[] = [
        { id: 'L1', joints: ['J1', 'J3'], isGround: true },
        { id: 'L2', joints: ['J1', 'J2'], type: 'binary', color: '#60a5fa' }, // Crank
        { id: 'L3', joints: ['J2', 'J3'], type: 'binary', color: '#fbbf24' }, // Yoke (drawn as slider with slot)
    ];

    return {
        id: 'scotch_' + Date.now(),
        name: 'Scotch Yoke',
        description: 'Contains a Pin-in-Slot joint (Higher Pair, f=2). Converts rotation to SHM.',
        links,
        joints,
        expectedN: 3,
        expectedJ: 3,
        expectedSumFi: 4,
        expectedM: 1,
        solve: (t: number, currentJoints) => {
            const j1 = currentJoints.find(j => j.id === 'J1')!;
            
            // Crank Pin Position
            const pinX = j1.x + crankLen * Math.cos(t);
            const pinY = j1.y + crankLen * Math.sin(t);
            
            // Yoke X follows Pin X. Yoke Y is fixed (assuming horizontal slider)
            const yokeX = pinX;
            // The J3 joint represents the slider block center on the ground track
            // Let's place it aligned with pinX for simplicity of drawing L3
            // Actually, J3 is the slider constraint location. 
            // In our visualizer, J3 is the "P" block.
            // The Yoke (L3) connects J2 (Pin slot) to J3 (Slider). 
            // Visualizer draws line J2->J3.
            // J3 y is fixed at Ay.
            
            return currentJoints.map(j => {
                if (j.id === 'J2') return { ...j, x: pinX, y: pinY };
                if (j.id === 'J3') return { ...j, x: yokeX }; // Moves horizontally
                return j;
            });
        }
    }
}

export const generateWhitworthQuickReturn = (): Mechanism => {
    // Whitworth Quick Return (Variation of Slotted Link)
    // Links: Ground(1), Crank(2), Slotted Lever(3).
    // Joints: G-Crank(R), G-Lever(R), Crank-Lever(PinSlot, f=2).
    // n=3, j=3, sumFi = 1+1+2=4. M = 1.
    // The "Pin" is on the Crank. The "Slot" is on the Lever.
    
    const Ax = 250, Ay = 300; // Crank Pivot
    const Bx = 250, By = 200; // Lever Pivot (Ground, above Crank)
    const crankLen = 60;
    const leverLen = 200; // Total length of lever arm
    
    const joints: Joint[] = [
        { id: 'J1', type: 'R', x: Ax, y: Ay, ground: true, isDriver: true, connectivity: 1 }, // Crank Pivot
        { id: 'J2', type: 'PinSlot', x: Ax+crankLen, y: Ay, connectivity: 2 }, // Pin on Crank, sliding in Lever
        { id: 'J3', type: 'R', x: Bx, y: By, ground: true, connectivity: 1 }, // Lever Pivot
        { id: 'J4', type: 'R', x: Bx + leverLen, y: By, connectivity: 0 }, // Lever Tip (visual only, for link drawing)
    ];
    
    // Note: J4 connectivity 0 because it's just a visual end-point of Link 3, not a kinematic pair in the loop analysis.
    // We only count J1, J2, J3 for mobility.
    // J4 is not a joint connecting to another link in this simplified loop. 
    // Wait, if we count J4 as a joint, we must account for it. 
    // J4 is just a point on L3. It is not a "Joint".
    // Joints array should strictly contain joints.
    // But LinkageCanvas uses joints array to look up coordinates.
    // I'll mark J4 as not a joint for calculation purposes? 
    // The type `Joint` has connectivity. I'll filter by connectivity > 0 in App calculation or user must know?
    // User counts "Joints". J4 is just an end of a stick. 
    // Let's NOT put J4 in the "joints" count but present in the array for visual.
    // I'll handle this by giving it connectivity undefined or 0, and user usually won't count a free end as a joint.
    
    const links: Link[] = [
        { id: 'L1', joints: ['J1', 'J3'], isGround: true },
        { id: 'L2', joints: ['J1', 'J2'], type: 'binary' }, // Crank
        { id: 'L3', joints: ['J3', 'J2', 'J4'], type: 'binary', color: '#fcd34d' }, // Slotted Lever (Visualized as J3->J2->J4?)
    ];

    return {
        id: 'whitworth_' + Date.now(),
        name: 'Slotted Link Quick Return',
        description: 'Pin-in-Slot joint (f=2) produces quick return motion. Note: Tip of lever is free end.',
        links,
        joints,
        expectedN: 3,
        expectedJ: 3, // J1, J2, J3
        expectedSumFi: 4, // 1+2+1
        expectedM: 1,
        solve: (t: number, currentJoints) => {
            const j1 = currentJoints.find(j => j.id === 'J1')!;
            const j3 = currentJoints.find(j => j.id === 'J3')!;
            
            // Crank Pin (J2)
            const pinX = j1.x + crankLen * Math.cos(t);
            const pinY = j1.y + crankLen * Math.sin(t);
            
            // Lever Angle determined by Pin position relative to Lever Pivot (J3)
            const dx = pinX - j3.x;
            const dy = pinY - j3.y;
            const angle = Math.atan2(dy, dx);
            
            // Lever Tip (J4)
            const tipX = j3.x + leverLen * Math.cos(angle);
            const tipY = j3.y + leverLen * Math.sin(angle);

            return currentJoints.map(j => {
                if (j.id === 'J2') return { ...j, x: pinX, y: pinY, angle: angle }; // Angle for slot rotation
                if (j.id === 'J4') return { ...j, x: tipX, y: tipY };
                return j;
            });
        }
    }
}

export const generateCoincident6Bar = (): Mechanism => {
    // Coincident Joint 6-Bar
    // Two cranks (L2, L4) driving a common slider (L6) via connecting rods (L3, L5).
    // The Rods (L3, L5) and Slider (L6) meet at ONE common pin.
    // Links: G(1), C1(2), R1(3), C2(4), R2(5), S(6).
    // Joints: 
    // G-C1 (R)
    // C1-R1 (R)
    // G-C2 (R)
    // C2-R2 (R)
    // G-S (P) -> Slider to Ground
    // Common Pin: Connects R1, R2, S. 3 Links meet. Counts as 2 Joints.
    // We will model this as TWO joints at the same location in the array: J_Common1 (R1-S), J_Common2 (R2-S).
    // Wait, physically one pin. To make the "J" count correct (7), we need to present 7 entries or expect user to count 7.
    // If we put 2 joints in the array at same x,y, the visualizer draws them on top of each other.
    
    const G1x = 150, G1y = 350;
    const G2x = 450, G2y = 350;
    const sliderX = 300; // Vertical slider at x=300
    
    const crankLen = 80;
    const rodLen = 220;
    
    const joints: Joint[] = [
        { id: 'J1', type: 'R', x: G1x, y: G1y, ground: true, isDriver: true, connectivity: 1 },
        { id: 'J2', type: 'R', x: G1x, y: G1y-crankLen, connectivity: 1 },
        { id: 'J3', type: 'R', x: G2x, y: G2y, ground: true, connectivity: 1 },
        { id: 'J4', type: 'R', x: G2x, y: G2y-crankLen, connectivity: 1 },
        { id: 'J5', type: 'P', x: sliderX, y: 150, ground: true, slideAxisAngle: 90, connectivity: 1 }, // Slider Ground
        
        // Coincident Joints at the slider pin
        // This pin connects L3 (Rod1), L5 (Rod2), and L6 (Slider Block).
        // J6: Rod1 to Slider
        // J7: Rod2 to Slider
        // Actually physically: Rod1, Rod2, Slider all hinged together.
        // n=6. M=1. Formula: 3(6-j-1) + sumFi = 1 => 15 - 3j + sumFi = 1 => sumFi - 3j = -14.
        // If all R/P joints (f=1): j - 3j = -14 => -2j = -14 => j=7.
        // So we need 7 joints.
        // J1, J2, J3, J4, J5 are 5 joints. We need 2 more.
        // The common connection must count as 2.
        { id: 'J6', type: 'R', x: sliderX, y: 150, connectivity: 1 }, 
        { id: 'J7', type: 'R', x: sliderX, y: 150, connectivity: 1 },
    ];
    
    const links: Link[] = [
        { id: 'L1', joints: ['J1', 'J3', 'J5'], isGround: true },
        { id: 'L2', joints: ['J1', 'J2'], type: 'binary' }, // Crank1
        { id: 'L3', joints: ['J2', 'J6'], type: 'binary' }, // Rod1
        { id: 'L4', joints: ['J3', 'J4'], type: 'binary' }, // Crank2
        { id: 'L5', joints: ['J4', 'J7'], type: 'binary' }, // Rod2
        { id: 'L6', joints: ['J5', 'J6', 'J7'], type: 'ternary', color: '#60a5fa' }, // Slider Block (Joints J6,J7 are on it, J5 is ground constraint)
    ];

    return {
        id: 'coincident_' + Date.now(),
        name: 'Coincident Joint 6-Bar',
        description: 'Two cranks driving a common slider. Note: 3 links meet at the slider pin (counts as 2 joints).',
        links,
        joints,
        expectedN: 6,
        expectedJ: 7,
        expectedSumFi: 7,
        expectedM: 1,
        solve: (t: number, currentJoints) => {
            const j1 = currentJoints.find(j => j.id === 'J1')!;
            const j3 = currentJoints.find(j => j.id === 'J3')!;
            
            // Crank 1 (Driver)
            const c1x = j1.x + crankLen * Math.cos(t);
            const c1y = j1.y + crankLen * Math.sin(t);
            
            // Slider Pin Position (constrained to vertical line x = sliderX)
            // Intersection of Circle(c1, rodLen) and Line(x=sliderX)
            const pinPos = findCircleLineIntersection({x: c1x, y: c1y}, rodLen, {x: sliderX, y: 0}, Math.PI/2);
            
            if (!pinPos) return currentJoints;
            
            // Crank 2 must follow
            // Intersection of Circle(j3, crankLen) and Circle(pinPos, rodLen)
            // Choose the one that keeps appropriate chirality or close to prev? 
            // Simple heuristic: keep y < j3.y (upper half)
            const c2Pos = findCircleIntersection(j3, crankLen, pinPos, rodLen, true);
            
            if (!c2Pos) return currentJoints;
            
            return currentJoints.map(j => {
                if (j.id === 'J2') return { ...j, x: c1x, y: c1y };
                if (j.id === 'J6') return { ...j, x: pinPos.x, y: pinPos.y };
                if (j.id === 'J7') return { ...j, x: pinPos.x, y: pinPos.y }; // Coincident
                if (j.id === 'J5') return { ...j, x: pinPos.x, y: pinPos.y }; // Slider moves
                if (j.id === 'J4') return { ...j, x: c2Pos.x, y: c2Pos.y };
                return j;
            });
        }
    }
}

export const generateSliderCrank = (): Mechanism => {
  const Ax = jitter(150), Ay = jitter(250);
  const crankLen = 60 + Math.random() * 20;
  const conRodLen = 180 + Math.random() * 40;
  const offset = jitter(20, 30); 

  const joints: Joint[] = [
    { id: 'J1', type: 'R', x: Ax, y: Ay, ground: true, isDriver: true, connectivity: 1 },
    { id: 'J2', type: 'R', x: Ax, y: Ay - crankLen, connectivity: 1 },
    { id: 'J3', type: 'R', x: Ax + 150, y: Ay - offset, connectivity: 1 }, 
    { id: 'J4', type: 'P', x: Ax + 150, y: Ay - offset, ground: true, slideAxisAngle: 0, connectivity: 1 }, 
  ];
  
  const links: Link[] = [
    { id: 'L1', joints: ['J1', 'J4'], isGround: true, type: 'binary' }, 
    { id: 'L2', joints: ['J1', 'J2'], type: 'binary' }, 
    { id: 'L3', joints: ['J2', 'J3'], type: 'binary' }, 
    { id: 'L4', joints: ['J3', 'J4'], type: 'binary' }, 
  ];

  return {
    id: 'slider_crank_' + Date.now(),
    name: 'Slider-Crank',
    description: 'Converts rotational motion into reciprocating linear motion.',
    links,
    joints,
    expectedN: 4,
    expectedJ: 4, 
    expectedSumFi: 4,
    expectedM: 1, 
    solve: (angleRad: number, currentJoints) => {
        const j1 = currentJoints.find(j => j.id === 'J1')!;
        
        const Bx = j1.x + crankLen * Math.cos(angleRad);
        const By = j1.y + crankLen * Math.sin(angleRad);

        const sliderY = j1.y - offset;
        const dy = sliderY - By;
        const dxSq = conRodLen * conRodLen - dy * dy;
        
        if (dxSq < 0) return currentJoints; 
        const sliderX = Bx + Math.sqrt(dxSq); 

        return currentJoints.map(j => {
            if (j.id === 'J2') return { ...j, x: Bx, y: By };
            if (j.id === 'J3') return { ...j, x: sliderX, y: sliderY }; 
            if (j.id === 'J4') return { ...j, x: sliderX, y: sliderY }; 
            return j;
        });
    }
  };
};

export const generateCamFollower = (): Mechanism => {
  const Ax = 300, Ay = 300;
  const baseRadius = 50;
  const camEccentricity = 30;

  const joints: Joint[] = [
    { id: 'J1', type: 'R', x: Ax, y: Ay, ground: true, isDriver: true, angle: 0, connectivity: 1 }, 
    { id: 'J2', type: 'Cam', x: Ax, y: Ay - baseRadius - camEccentricity, connectivity: 2 }, 
    { id: 'J3', type: 'P', x: Ax, y: Ay - 150, ground: true, slideAxisAngle: 90, connectivity: 1 }, 
  ];

  const links: Link[] = [
    { id: 'L1', joints: ['J1', 'J3'], isGround: true }, 
    { id: 'L2', joints: ['J1', 'J2'] }, 
    { id: 'L3', joints: ['J2', 'J3'] }, 
  ];

  return {
    id: 'cam_' + Date.now(),
    name: 'Plate Cam & Follower',
    description: 'A higher-pair mechanism with 1 degree of freedom.',
    links,
    joints,
    expectedN: 3, 
    expectedJ: 3, 
    expectedSumFi: 4, 
    expectedM: 1, 
    solve: (angleRad: number, currentJoints) => {
        const lift = camEccentricity * Math.sin(angleRad - Math.PI/2); 
        const contactY = Ay - baseRadius - camEccentricity - lift;

        return currentJoints.map(j => {
            if (j.id === 'J1') return { ...j, angle: angleRad };
            if (j.id === 'J2') return { ...j, y: contactY };
            return j;
        });
    }
  };
};

export const getRandomMechanism = (): Mechanism => {
    const generators = [
        generateFourBar,
        generateSliderCrank,
        generateWaterPump,
        generateFoldingChair,
        generateHydraulicLift,
        generateEllipticalTrainer,
        generateParallelogram,
        generateWattLinkage,
        generateWattSixBar,
        generateStephensonSixBar,
        generateScotchYoke,
        generateWhitworthQuickReturn,
        generateCoincident6Bar,
        generateCamFollower
    ];
    
    // Pick random generator
    const randomIndex = Math.floor(Math.random() * generators.length);
    return generators[randomIndex]();
}