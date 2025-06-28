import React from 'react';
import { LucideProps } from 'lucide-react';
import { themeSvgIconColor } from '@base-ui/lib/theme-util';

const LogIcon = React.forwardRef<SVGSVGElement, LucideProps>(
  ({ color = "currentColor", className, ...props }, ref) => (
    <svg
      ref={ref}
      role="img"   
      className={className} 
      {...props}
      viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M568.896 910.208h-512V113.792h739.52V512h-56.832V170.688H113.792v682.624H512z"
        fill={themeSvgIconColor} p-id="12257">
      </path>
      <path
        d="M711.104 512c108.096 0 199.104 91.008 199.104 199.104 0 108.096-91.008 199.104-199.04 199.104C602.944 910.208 512 819.2 512 711.168 512 602.944 603.008 512 711.104 512m0-56.896c-142.208 0-256 113.792-256 256s113.792 256 256 256 256-113.792 256-256-113.792-256-256-256zM227.584 56.96h56.832v170.688h-56.832V56.896z m341.312 0h56.896v170.688h-56.96V56.896zM170.688 341.312h512v56.96h-512v-56.96z m0 170.688H455.04v56.896H170.688V512z m0 170.688h227.52v56.896H170.688v-56.96z"
        fill={themeSvgIconColor} p-id="12258">
      </path>
      <path d="M853.312 796.416h-170.624V568.96h56.896v170.688h113.728z" fill={themeSvgIconColor} p-id="12259">
      </path>
    </svg>
  )
);

LogIcon.displayName = "Log";

export default LogIcon;
