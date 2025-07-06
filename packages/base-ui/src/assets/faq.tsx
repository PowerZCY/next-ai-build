import React from 'react';
import { LucideProps } from 'lucide-react';
import { themeSvgIconColor } from '@base-ui/lib/theme-util';

const FAQIcon = React.forwardRef<SVGSVGElement, LucideProps>(
  ({ color = "currentColor", className, ...props }, ref) => (
    <svg ref={ref}
      role="img" 
      className={className} 
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      {...props}
      viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill='none' stroke={themeSvgIconColor}/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" fill='none' stroke={themeSvgIconColor} />
      <path d="M12 17h.01" fill='none' stroke={themeSvgIconColor} />
    </svg>
  )
);

FAQIcon.displayName = "FAQ";

export default FAQIcon;
