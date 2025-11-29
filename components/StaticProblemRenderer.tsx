
import React from 'react';
import { StaticProblem } from '../types';

interface Props {
  problem: StaticProblem;
}

const StaticProblemRenderer: React.FC<Props> = ({ problem }) => {
  return (
    <div className="w-full h-[400px] bg-white rounded-lg shadow-inner border border-slate-200 flex items-center justify-center p-4">
      <svg width="100%" height="100%" viewBox="0 0 500 400" preserveAspectRatio="xMidYMid meet">
        <defs>
           <pattern id="hatch" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
              <line x1="0" y="0" x2="0" y2="10" stroke="#cbd5e1" strokeWidth="1" />
           </pattern>
        </defs>
        {problem.svgContent}
      </svg>
    </div>
  );
};

export default StaticProblemRenderer;
