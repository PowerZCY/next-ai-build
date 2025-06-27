import React from 'react';
import { LucideProps } from 'lucide-react';
import { themeSvgIconColor } from '@base-ui/lib/theme-util';

const MermaidIcon = React.forwardRef<SVGSVGElement, LucideProps>(
  // Memmaid need special size for good view
  ({ size = 16, color = "currentColor", className, ...props }, ref) => (
    <svg
      ref={ref}
      role="img"
      width={size}
      height={size}
      className={className}
      {...props}
      viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" >
      <path
        d="M23.99 2.115A12.223 12.223 0 0 0 12 10.149 12.223 12.223 0 0 0 .01 2.115a12.23 12.23 0 0 0 5.32 10.604 6.562 6.562 0 0 1 2.845 5.423v3.754h7.65v-3.754a6.561 6.561 0 0 1 2.844-5.423 12.223 12.223 0 0 0 5.32-10.604Z"
        fill="none" stroke={themeSvgIconColor} strokeWidth="2" 
      />
    </svg>
  )
);

MermaidIcon.displayName = "Mmd";

export default MermaidIcon; 