import React from 'react';
import { LucideProps } from 'lucide-react';
import { themeSvgIconColor } from '@base-ui/lib/theme-util';

const DiffIcon = React.forwardRef<SVGSVGElement, LucideProps>(
  ({ color = "currentColor", className, ...props }, ref) => (
    <svg
     ref={ref}
      role="img" 
      className={className} 
      {...props}
      viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 0h24v24H0z" />
      <path fill={themeSvgIconColor}
        d="M18 23H4c-1.1 0-2-.9-2-2V7h2v14h14zM14.5 7V5h-2v2h-2v2h2v2h2V9h2V7zm2 6h-6v2h6zM15 1H8c-1.1 0-1.99.9-1.99 2L6 17c0 1.1.89 2 1.99 2H19c1.1 0 2-.9 2-2V7zm4 16H8V3h6.17L19 7.83z" 
      />
    </svg>
  )
);

DiffIcon.displayName = "Diff";

export default DiffIcon;
