import React from 'react';
import { LucideProps } from 'lucide-react';
import { themeSvgIconColor, themeSvgIconSize } from '@base-ui/lib/theme-util';

const SchemeIcon = React.forwardRef<SVGSVGElement, LucideProps>(
  ({ size = themeSvgIconSize, color = "currentColor", className, ...props }, ref) => (
    <svg
     ref={ref}
      role="img"  
      width={size} 
      height={size} 
      className={className} 
      {...props}
      viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fill={themeSvgIconColor}
        d="M5.11 21.186 9.887 7.303 8.945 5.11H7.407V2.813h2.296c.483 0 .896.299 1.068.724l6.58 15.353h1.539v2.296h-2.297a1.14 1.14 0 0 1-1.068-.735L11.231 10.45 7.544 21.186z"
      />
    </svg>
  )
);

SchemeIcon.displayName = "Scheme";

export default SchemeIcon;
