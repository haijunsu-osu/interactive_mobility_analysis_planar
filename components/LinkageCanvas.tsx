import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { Mechanism, Joint, Link } from '../types';

interface LinkageCanvasProps {
  mechanism: Mechanism;
  onJointClick?: (jointId: string) => void;
}

const LinkageCanvas: React.FC<LinkageCanvasProps> = ({ mechanism, onJointClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !mechanism) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous

    const width = containerRef.current?.clientWidth || 600;
    const height = 500;
    
    // Define hatch pattern for ground
    const defs = svg.append("defs");
    defs.append("pattern")
        .attr("id", "diagonalHatch")
        .attr("patternUnits", "userSpaceOnUse")
        .attr("width", 8)
        .attr("height", 8)
        .append("path")
        .attr("d", "M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4")
        .attr("stroke", "#94a3b8")
        .attr("stroke-width", 1);

    // Draw Links
    const linkGroup = svg.append("g").attr("class", "links");
    
    mechanism.links.forEach(link => {
        if (link.isGround) {
            // Visualize ground connection abstractly
            if (link.joints.length >= 2 && link.type === 'binary') {
                const j1 = mechanism.joints.find(j => j.id === link.joints[0]);
                const j2 = mechanism.joints.find(j => j.id === link.joints[1]);
                if (j1 && j2) {
                    linkGroup.append("line")
                        .attr("x1", j1.x)
                        .attr("y1", j1.y)
                        .attr("x2", j2.x)
                        .attr("y2", j2.y)
                        .attr("stroke", "#94a3b8")
                        .attr("stroke-width", 8)
                        .attr("stroke-linecap", "round");
                        
                    // Hatch overlay
                     linkGroup.append("line")
                        .attr("x1", j1.x)
                        .attr("y1", j1.y)
                        .attr("x2", j2.x)
                        .attr("y2", j2.y)
                        .attr("stroke", "url(#diagonalHatch)")
                        .attr("stroke-width", 6);
                }
            }
            return; 
        }

        // Standard rigid body link
        // Find positions
        const coords = link.joints.map(jid => mechanism.joints.find(j => j.id === jid)).filter(Boolean) as Joint[];
        if (coords.length < 2) {
            return;
        }

        if (link.type === 'ternary' && coords.length === 3) {
            const path = d3.path();
            path.moveTo(coords[0].x, coords[0].y);
            path.lineTo(coords[1].x, coords[1].y);
            path.lineTo(coords[2].x, coords[2].y);
            path.closePath();
            
            linkGroup.append("path")
                .attr("d", path.toString())
                .attr("fill", link.color || "#cbd5e1")
                .attr("stroke", "#475569")
                .attr("stroke-width", 2)
                .attr("opacity", 0.7);
        } else {
             // Binary chain or visual chain
             for(let i=0; i<coords.length - 1; i++) {
                 linkGroup.append("line")
                    .attr("x1", coords[i].x)
                    .attr("y1", coords[i].y)
                    .attr("x2", coords[i+1].x)
                    .attr("y2", coords[i+1].y)
                    .attr("stroke", "#475569")
                    .attr("stroke-width", 8)
                    .attr("stroke-linecap", "round");
                    
                // Inner color
                 linkGroup.append("line")
                    .attr("x1", coords[i].x)
                    .attr("y1", coords[i].y)
                    .attr("x2", coords[i+1].x)
                    .attr("y2", coords[i+1].y)
                    .attr("stroke", link.color || "#e2e8f0")
                    .attr("stroke-width", 4)
                    .attr("stroke-linecap", "round");
             }
        }
    });

    // Draw Joints
    const jointGroup = svg.append("g").attr("class", "joints");
    
    mechanism.joints.forEach(joint => {
        // Handle rotation for P and PinSlot
        // For P, angle is slideAxisAngle.
        // For PinSlot, angle is the orientation of the slot (usually linked to the link angle).
        let rotation = 0;
        if (joint.type === 'P' && joint.slideAxisAngle !== undefined) {
            rotation = -joint.slideAxisAngle; // SVG rotation is CW, mathematical CCW
        }
        if (joint.type === 'PinSlot' && joint.angle !== undefined) {
             rotation = -(joint.angle * 180 / Math.PI); // Convert rad to deg if coming from solver
             // Or if fixed angle (Scotch Yoke), use that.
             // If angle > 2*PI, assume degrees? No, assume Rad in simulation state usually.
             // But generator static props might be deg.
             // Let's normalize: logic above assumes generator provides Degrees for 'P' static, 
             // and Solver provides Radians for dynamic.
             if (Math.abs(rotation) < 10 && joint.angle < 7) { // Heuristic: it's radians
                 rotation = -(joint.angle * 180 / Math.PI);
             } else {
                 rotation = -joint.angle;
             }
        }

        const g = jointGroup.append("g")
            .attr("transform", `translate(${joint.x}, ${joint.y}) rotate(${rotation})`)
            .attr("cursor", joint.isDriver ? "pointer" : "default")
            .on("click", () => {
                if (joint.isDriver && onJointClick) onJointClick(joint.id);
            });

        if (joint.ground) {
            // Draw ground hash marks - aligned with local coordinate system if P joint?
            // If P joint ground, hashes should be on the fixed side.
            g.append("path")
                .attr("d", "M-15,10 L-20,18 M0,10 L-5,18 M15,10 L10,18")
                .attr("stroke", "#64748b")
                .attr("stroke-width", 2);
            g.append("rect") // Ground base
                .attr("x", -20)
                .attr("y", 0)
                .attr("width", 40)
                .attr("height", 10)
                .attr("fill", "#94a3b8");
        }

        if (joint.type === 'R') {
             // Revolute: Circle
             // Coincident check: if multiple joints here, draw slightly smaller or transparent to show stacking?
             // Or just standard. Standard is fine, they stack.
             g.append("circle")
                .attr("r", 8)
                .attr("fill", joint.isDriver ? "#ef4444" : "#3b82f6") 
                .attr("stroke", "white")
                .attr("stroke-width", 2)
                .attr("fill-opacity", 0.9); // Slight opacity to hint overlapping
             
             g.append("circle")
                .attr("r", 3)
                .attr("fill", "white");

        } else if (joint.type === 'P') {
            // Prismatic: Rect block
            g.append("rect")
                .attr("x", -15)
                .attr("y", -10)
                .attr("width", 30)
                .attr("height", 20)
                .attr("fill", "#3b82f6")
                .attr("stroke", "#1e40af")
                .attr("stroke-width", 2)
                .attr("rx", 2);
            
            // Slide guide line
            g.append("line")
                .attr("x1", -40)
                .attr("y1", 12)
                .attr("x2", 40)
                .attr("y2", 12)
                .attr("stroke", "#64748b")
                .attr("stroke-width", 2);
                
        } else if (joint.type === 'Cam') {
             g.append("circle")
                .attr("r", 4)
                .attr("fill", "#10b981");
                
        } else if (joint.type === 'PinSlot') {
            // Visualize as a slot with a pin inside
            // Slot rect (long)
            g.append("rect")
                .attr("x", -30)
                .attr("y", -10)
                .attr("width", 60)
                .attr("height", 20)
                .attr("fill", "none")
                .attr("stroke", "#3b82f6")
                .attr("stroke-width", 3)
                .attr("rx", 4);
                
            // Pin
             g.append("circle")
                .attr("r", 6)
                .attr("fill", "#ef4444")
                .attr("stroke", "white")
                .attr("stroke-width", 1);
        }
        
        // Cam Profile Specifics
        if (mechanism.name.includes('Cam') && joint.id === 'J1') {
            const camRadius = 50;
            const eccentricity = 30;
            const rot = joint.angle || 0;
            
            g.append("circle")
                .attr("cx", eccentricity * Math.cos(rot))
                .attr("cy", eccentricity * Math.sin(rot))
                .attr("r", camRadius)
                .attr("fill", "#fca5a5")
                .attr("stroke", "#b91c1c")
                .attr("fill-opacity", 0.3)
                .attr("stroke-width", 2);
             
             g.append("path")
                .attr("d", "M-4,-4 L4,4 M-4,4 L4,-4")
                .attr("stroke", "black")
                .attr("stroke-width", 1);
        }
    });

  }, [mechanism, onJointClick]);

  return (
    <div ref={containerRef} className="w-full h-[500px] bg-white rounded-lg shadow-inner border border-slate-200 overflow-hidden relative">
      <svg ref={svgRef} width="100%" height="100%" className="absolute inset-0" />
      <div className="absolute bottom-2 right-2 text-xs text-slate-400 pointer-events-none">
        Powered by D3.js
      </div>
    </div>
  );
};

export default LinkageCanvas;