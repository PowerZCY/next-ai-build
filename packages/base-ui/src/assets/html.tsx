import React from 'react';
import { LucideProps } from 'lucide-react';
import { themeSvgIconColor } from '@base-ui/lib/theme-util';

const HtmlIcon = React.forwardRef<SVGSVGElement, LucideProps>(
  ({ color = "currentColor", className, ...props }, ref) => (
    <svg
      ref={ref}
      role="img"
      className={className}
      {...props}
      viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" >
      <path fill={themeSvgIconColor}
        d="m4 4 2 22 10 2 10-2 2-22Zm19.72 7H11.28l.29 3h11.86l-.802 9.335L15.99 25l-6.635-1.646L8.93 19h3.02l.19 2 3.86.77 3.84-.77.29-4H8.84L8 8h16Z" 
      />
    </svg>
  )
);

HtmlIcon.displayName = "Html";

export default HtmlIcon; 