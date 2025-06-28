import React from 'react';
import { LucideProps } from 'lucide-react';
import { themeSvgIconColor } from '@base-ui/lib/theme-util';

const JavaIcon = React.forwardRef<SVGSVGElement, LucideProps>(
  ({ color = "currentColor", className, ...props }, ref) => (
    <svg
      ref={ref}
      role="img" 
      className={className} 
      {...props}
      viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 26h24v2H4zM28 4H7a1 1 0 0 0-1 1v13a4 4 0 0 0 4 4h10a4 4 0 0 0 4-4v-4h4a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2m0 8h-4V6h4Z"
        fill="none" stroke={themeSvgIconColor} strokeWidth="2"
      />
    </svg>
  )
);

JavaIcon.displayName = "Java";

export default JavaIcon;
