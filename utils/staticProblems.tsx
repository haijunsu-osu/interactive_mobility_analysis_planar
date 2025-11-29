
import React from 'react';
import { StaticProblem } from '../types';

export const textbookProblems: StaticProblem[] = [
  {
    id: 'prob_1_6_pump',
    title: 'Problem 1.6 (Water Pump)',
    description: 'A vertical water pump mechanism. Determine the mobility.',
    expectedN: 4,
    expectedJ: 4,
    expectedSumFi: 4,
    expectedM: 1,
    svgContent: (
      <g>
        {/* Ground */}
        <path d="M250,50 L250,40 M240,40 L260,40" stroke="#64748b" strokeWidth="2" />
        <rect x="230" y="200" width="40" height="100" fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4" />
        
        {/* Links */}
        <line x1="250" y1="50" x2="280" y2="150" stroke="#475569" strokeWidth="6" strokeLinecap="round" />
        <line x1="280" y1="150" x2="250" y2="250" stroke="#475569" strokeWidth="6" strokeLinecap="round" />
        
        {/* Piston */}
        <rect x="235" y="230" width="30" height="40" fill="#60a5fa" stroke="#2563eb" strokeWidth="2" />
        
        {/* Joints */}
        <circle cx="250" cy="50" r="5" fill="white" stroke="black" strokeWidth="2" />
        <circle cx="280" cy="150" r="5" fill="white" stroke="black" strokeWidth="2" />
        <circle cx="250" cy="250" r="5" fill="white" stroke="black" strokeWidth="2" />
        
        {/* Labels */}
        <text x="260" y="50" fontSize="12" fill="#333">A</text>
        <text x="290" y="150" fontSize="12" fill="#333">B</text>
      </g>
    )
  },
  {
    id: 'prob_1_6_chair',
    title: 'Problem 1.6 (Folding Chair)',
    description: 'Folding chair mechanism with a pin-in-slot joint.',
    expectedN: 3,
    expectedJ: 3,
    expectedSumFi: 4, // R, R, PinSlot(2)
    expectedM: 1,
    svgContent: (
      <g>
        {/* Ground */}
        <line x1="150" y1="350" x2="350" y2="350" stroke="#94a3b8" strokeWidth="2" />
        <path d="M150,350 L140,360 M170,350 L160,360 M330,350 L320,360" stroke="#94a3b8" strokeWidth="1" />

        {/* Backrest Leg */}
        <line x1="180" y1="350" x2="100" y2="100" stroke="#f87171" strokeWidth="6" strokeLinecap="round" />
        
        {/* Seat Leg */}
        <line x1="300" y1="350" x2="140" y2="200" stroke="#60a5fa" strokeWidth="6" strokeLinecap="round" />
        
        {/* Pin in Slot Visual */}
        <circle cx="148" cy="250" r="4" fill="#333" />
        <text x="160" y="250" fontSize="10" fill="#555">Pin-in-slot</text>
        
        {/* Joints */}
        <circle cx="180" cy="350" r="5" fill="white" stroke="black" strokeWidth="2" />
        <circle cx="300" cy="350" r="5" fill="white" stroke="black" strokeWidth="2" />
      </g>
    )
  },
  {
    id: 'prob_1_9',
    title: 'Problem 1.9 (Excavator)',
    description: 'Excavator mechanism. Treat hydraulic cylinders as sliders in tubes.',
    // 1.12(b): n=11, j=14, M=2. (Bucket tilt + Arm lift).
    expectedN: 11, 
    expectedJ: 14,
    expectedSumFi: 14,
    expectedM: 2,
    svgContent: (
      <g transform="translate(50, 50) scale(0.8)">
        {/* Frame */}
        <path d="M0,300 L100,300 L100,250" stroke="#333" strokeWidth="4" fill="none" />
        
        {/* Boom */}
        <path d="M100,250 L300,100 L450,150" stroke="#fcd34d" strokeWidth="12" strokeLinecap="round" fill="none" />
        
        {/* Stick */}
        <line x1="300" y1="100" x2="300" y2="350" stroke="#fcd34d" strokeWidth="10" strokeLinecap="round" />
        
        {/* Bucket */}
        <path d="M300,350 Q350,400 250,400 Z" fill="#fbbf24" stroke="black" />
        
        {/* Cylinders */}
        {/* Main Lift */}
        <line x1="80" y1="280" x2="200" y2="180" stroke="#94a3b8" strokeWidth="8" />
        <line x1="200" y1="180" x2="250" y2="140" stroke="#64748b" strokeWidth="4" />
        
        {/* Stick Cyl */}
        <line x1="250" y1="120" x2="350" y2="80" stroke="#94a3b8" strokeWidth="8" />
        
        {/* Bucket Cyl */}
        <line x1="280" y1="120" x2="250" y2="250" stroke="#94a3b8" strokeWidth="6" />
        
        <text x="50" y="350" fontSize="14">Loader Mechanism (1.12b)</text>
      </g>
    )
  },
  {
    id: 'prob_1_13a',
    title: 'Problem 1.13a (Pin in Slot)',
    description: 'Mechanism with a pin-in-slot joint.',
    // Ah, looking at solution 1.6 second image (Pin in slot). n=3, j=3, sumFi=4. M=1.
    expectedN: 3,
    expectedJ: 3,
    expectedSumFi: 4,
    expectedM: 1,
    svgContent: (
      <g transform="translate(100,50)">
        <line x1="0" y1="200" x2="100" y2="100" stroke="#333" strokeWidth="4" />
        <line x1="100" y1="200" x2="50" y2="150" stroke="#333" strokeWidth="4" />
        <rect x="40" y="140" width="20" height="20" stroke="black" fill="none" transform="rotate(-45 50 150)" />
        <circle cx="0" cy="200" r="5" stroke="black" fill="white"/>
        <circle cx="100" cy="200" r="5" stroke="black" fill="white"/>
        <text x="20" y="250" fontSize="14">Pin-in-Slot (Prob 1.6b)</text>
      </g>
    )
  },
  {
    id: 'prob_1_17_loader',
    title: 'Problem 1.17 (Loader)',
    description: 'Front end loader linkage.',
    // Solution 1.12a says n=9, j=11, M=2.
    expectedN: 9,
    expectedJ: 11,
    expectedSumFi: 11,
    expectedM: 2,
    svgContent: (
      <g transform="translate(50,50)">
         <path d="M0,150 L100,150 L80,100" fill="none" stroke="#333" strokeWidth="2"/>
         <line x1="80" y1="100" x2="200" y2="50" stroke="#fcd34d" strokeWidth="8"/>
         <polygon points="200,50 250,150 180,150" fill="#fcd34d" stroke="black"/>
         <line x1="50" y1="120" x2="150" y2="80" stroke="#94a3b8" strokeWidth="6"/>
         <text x="10" y="200" fontSize="14">Loader (Prob 1.12a)</text>
      </g>
    )
  },
  {
    id: 'prob_1_19',
    title: 'Problem 1.19 (Wedge)',
    description: 'Rolling contact / Wedge mechanism.',
    expectedN: 4,
    expectedJ: 4,
    expectedSumFi: 4, // Based on Solution 1.19
    expectedM: 1,
    svgContent: (
      <g transform="translate(100,100)">
        <path d="M0,200 L200,200" stroke="black" strokeWidth="2"/>
        <path d="M0,0 L0,200" stroke="black" strokeWidth="2"/>
        <circle cx="100" cy="150" r="30" fill="#cbd5e1" stroke="black"/>
        <path d="M100,150 L50,50 L0,50" fill="none" stroke="#333" strokeWidth="4"/>
        <path d="M50,50 L50,200" stroke="#333" strokeWidth="4"/>
        <rect x="20" y="150" width="60" height="50" fill="#94a3b8" />
        <text x="150" y="150" fontSize="14">Wedge/Roller</text>
      </g>
    )
  },
  {
    id: 'prob_1_14c',
    title: 'Problem 1.14c (12-bar)',
    description: 'Complex 12-bar linkage.',
    expectedN: 12,
    expectedJ: 15,
    expectedSumFi: 15,
    expectedM: 3,
    svgContent: (
      <g transform="translate(50,50) scale(0.8)">
        <circle cx="100" cy="100" r="5" stroke="black" fill="white"/>
        <circle cx="200" cy="100" r="5" stroke="black" fill="white"/>
        <line x1="100" y1="100" x2="150" y2="200" stroke="#333" strokeWidth="2"/>
        <line x1="200" y1="100" x2="150" y2="200" stroke="#333" strokeWidth="2"/>
        <line x1="150" y1="200" x2="150" y2="300" stroke="#333" strokeWidth="2"/>
        <rect x="130" y="300" width="40" height="20" stroke="black" fill="white"/>
        <text x="20" y="350" fontSize="14">Complex Linkage (Prob 1.14c)</text>
      </g>
    )
  },
  {
    id: 'prob_1_29_a',
    title: 'Problem 1.29a (Spatial RSSR)',
    description: 'Spatial RSSR Mechanism. 2 Ground Revolutes, Coupler with 2 Spherical joints. (Use K=6). Note: M includes idle DOF.',
    expectedN: 4,
    expectedJ: 4, // R, S, S, R
    expectedSumFi: 8, // 1 + 3 + 3 + 1 = 8
    expectedM: 2, // 6(4-4-1) + 8 = 2. (1 useful + 1 idle spin)
    isSpatial: true,
    svgContent: (
      <g transform="translate(150, 100) scale(1.2)">
        {/* Ground Pivots */}
        <ellipse cx="0" cy="150" rx="15" ry="5" fill="#94a3b8" stroke="black"/>
        <line x1="0" y1="150" x2="0" y2="170" stroke="black" strokeWidth="2"/>
        <line x1="-10" y1="170" x2="10" y2="170" stroke="black" strokeWidth="2"/>
        
        <ellipse cx="200" cy="150" rx="15" ry="5" fill="#94a3b8" stroke="black"/>
        <line x1="200" y1="150" x2="200" y2="170" stroke="black" strokeWidth="2"/>
        <line x1="190" y1="170" x2="210" y2="170" stroke="black" strokeWidth="2"/>

        {/* Crank 1 */}
        <line x1="0" y1="150" x2="30" y2="50" stroke="#ef4444" strokeWidth="4" />
        
        {/* Crank 2 */}
        <line x1="200" y1="150" x2="170" y2="80" stroke="#3b82f6" strokeWidth="4" />
        
        {/* Coupler */}
        <line x1="30" y1="50" x2="170" y2="80" stroke="#fcd34d" strokeWidth="4" />
        
        {/* Spherical Joints */}
        <circle cx="30" cy="50" r="8" fill="url(#sphereGradient)" stroke="black"/>
        <circle cx="170" cy="80" r="8" fill="url(#sphereGradient)" stroke="black"/>
        
        <defs>
          <radialGradient id="sphereGradient" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="100%" stopColor="#777" />
          </radialGradient>
        </defs>
        
        <text x="50" y="200" fontSize="12" fill="#333">Spatial RSSR (K=6)</text>
      </g>
    )
  },
  {
    id: 'prob_1_29_b',
    title: 'Problem 1.29b (Spatial Slider)',
    description: 'Spatial mechanism with slider. R-S-S-P loop. (Use K=6).',
    expectedN: 4,
    expectedJ: 4, // R, S, S, P
    expectedSumFi: 8, // 1 + 3 + 3 + 1 = 8
    expectedM: 2, // 6(4-4-1) + 8 = 2
    isSpatial: true,
    svgContent: (
      <g transform="translate(100, 100) scale(1)">
        {/* Ground R */}
        <ellipse cx="0" cy="150" rx="10" ry="4" fill="#94a3b8" stroke="black"/>
        <line x1="0" y1="150" x2="40" y2="50" stroke="#ef4444" strokeWidth="4"/> {/* Crank */}
        <circle cx="40" cy="50" r="6" fill="url(#sphereGradient)" stroke="black"/> {/* S */}
        
        {/* Coupler */}
        <line x1="40" y1="50" x2="150" y2="100" stroke="#fcd34d" strokeWidth="4"/>
        <circle cx="150" cy="100" r="6" fill="url(#sphereGradient)" stroke="black"/> {/* S */}
        
        {/* Slider P */}
        <rect x="130" y="90" width="40" height="20" fill="#3b82f6" stroke="black" rx="2"/>
        <line x1="100" y1="100" x2="200" y2="100" stroke="#333" strokeWidth="2" strokeDasharray="4 2"/> {/* Slide Axis */}
        <text x="50" y="200" fontSize="12">R-S-S-P (Spatial)</text>
      </g>
    )
  }
];
