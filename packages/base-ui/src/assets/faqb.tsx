import React from 'react';
import { LucideProps } from 'lucide-react';
import { themeSvgIconColor } from '@base-ui/lib/theme-util';

const FAQBIcon = React.forwardRef<SVGSVGElement, LucideProps>(
  ({ color = "currentColor", className, ...props }, ref) => (
    <svg ref={ref}
      role="img" 
      className={className} 
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      {...props}
      viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fill='none' stroke={themeSvgIconColor}
        d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
      <path fill='none' stroke={themeSvgIconColor} d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line fill='none' stroke={themeSvgIconColor} x1="12" x2="12.01" y1="17" y2="17" />
    </svg>
  )
);

FAQBIcon.displayName = "FAQB";

export default FAQBIcon;
