import React from 'react';
import { LucideProps } from 'lucide-react';
import { themeSvgIconColor } from '@base-ui/lib/theme-util';

const CSSIcon = React.forwardRef<SVGSVGElement, LucideProps>(
  ({ color = "currentColor", className, ...props }, ref) => (
    <svg
      ref={ref} 
      role="img" 
      className={className} {...props}
      viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fill={themeSvgIconColor}
        d="M23.5 12H8c.89-2.3 4.02-4 7.75-4s6.86 1.7 7.75 4M14 12h15.5c-.89 2.3-4.02 4-7.75 4s-6.86-1.7-7.75-4m3.5 8H2c.89-2.3 4.02-4 7.75-4s6.86 1.7 7.75 4M8 20h15.5c-.89 2.3-4.02 4-7.75 4S8.89 22.3 8 20"
      />
    </svg>
  )
);

CSSIcon.displayName = "CSS";

export default CSSIcon;
