import React from 'react';
import { LucideProps } from 'lucide-react';
import { themeSvgIconColor } from '@base-ui/lib/theme-util';

const FAQSIcon = React.forwardRef<SVGSVGElement, LucideProps>(
  ({ color = "currentColor", className, ...props }, ref) => (
    <svg ref={ref}
      role="img" 
      className={className} 
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      {...props}
      viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fill='none' stroke={themeSvgIconColor}
        d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path fill='none' stroke={themeSvgIconColor} d="M9.1 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3" />
      <path fill='none' stroke={themeSvgIconColor} d="M12 17h.01" />
    </svg>
  )
);

FAQSIcon.displayName = "FAQS";

export default FAQSIcon;
