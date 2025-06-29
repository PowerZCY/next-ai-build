import React from 'react';
import { LucideProps } from 'lucide-react';
import { themeSvgIconColor } from '@base-ui/lib/theme-util';

const MDXIcon = React.forwardRef<SVGSVGElement, LucideProps>(
  ({ color = "currentColor", className, ...props }, ref) => (
    <svg
      ref={ref}
      role="img"
      className={className}
      {...props}
      viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20.48 327.76192a163.84 163.84 0 0 1 163.84-163.84h655.36a163.84 163.84 0 0 1 163.84 163.84v327.68a163.84 163.84 0 0 1-163.84 163.84H184.32a163.84 163.84 0 0 1-163.84-163.84v-327.68z m163.84-81.92a81.92 81.92 0 0 0-81.92 81.92v327.68a81.92 81.92 0 0 0 81.92 81.92h655.36a81.92 81.92 0 0 0 81.92-81.92v-327.68a81.92 81.92 0 0 0-81.92-81.92H184.32z m68.97664 84.00896a40.96 40.96 0 0 1 45.71136 14.336L389.12 464.24064l90.112-120.13568a40.96 40.96 0 0 1 73.728 24.576v245.76a40.96 40.96 0 0 1-81.92 0v-122.88l-49.152 65.536a41.04192 41.04192 0 0 1-65.536 0l-49.152-65.536v122.88a40.96 40.96 0 1 1-81.92 0v-245.76a40.96 40.96 0 0 1 28.01664-38.87104zM757.76 368.76288a40.96 40.96 0 0 0-81.92 0v146.8416l-12.00128-12.00128a40.96 40.96 0 0 0-57.91744 57.91744l81.92 81.92a40.96 40.96 0 0 0 57.91744 0l81.92-81.92a40.96 40.96 0 0 0-57.91744-57.91744l-12.00128 12.00128V368.72192z"
        p-id="7370"
        id="path1"
        style={{
          stroke: "none",
          strokeOpacity: 1,
          fill: themeSvgIconColor,
          fillOpacity: 1,
          strokeWidth: 16,
          strokeDasharray: "none"
        }} />
      <circle
        id="path3"
        cx="719.29987"
        cy="577.29211"
        r="40.298649"
        style={{
          opacity: 1,
          fill: "#FFFFFF",
          fillOpacity: 1,
          stroke: "none",
          strokeWidth: 9.49366,
          strokeDasharray: "none",
          strokeOpacity: 1
        }} />
      <circle
        id="path3-6"
        cx="850.25433"
        cy="310.07559"
        r="40.298649" 
        style={{
          fill: themeSvgIconColor,
          fillOpacity: 1,
          stroke: "none",
          strokeWidth: 9.49366,
          strokeDasharray: "none",
          strokeOpacity: 1
        }}/>
      <circle
        id="path3-6-8"
        cx="173.18126"
        cy="310.07559"
        r="40.298649" 
        style={{
          fill: themeSvgIconColor,
          fillOpacity: 1,
          stroke: "none",
          strokeWidth: 9.49366,
          strokeDasharray: "none",
          strokeOpacity: 1
        }} />
      <circle
        id="path3-6-8-7"
        cx="850.25433"
        cy="666.45483"
        r="40.298649" 
        style={{
          fill: themeSvgIconColor,
          fillOpacity: 1,
          stroke: "none",
          strokeWidth: 9.49366,
          strokeDasharray: "none",
          strokeOpacity: 1
        }} />
      <circle
        id="path3-6-4"
        cx="173.18126"
        cy="669.54193"
        r="40.298649"
        style={{
          fill: themeSvgIconColor,
          fillOpacity: 1,
          stroke: "none",
          strokeWidth: 9.49366,
          strokeDasharray: "none",
          strokeOpacity: 1
        }} />
    </svg>
  )
);

MDXIcon.displayName = "MDX";

export default MDXIcon; 