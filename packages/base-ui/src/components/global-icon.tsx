/* 
 * For the icon used in the project, unified management is required
 * 1. Strictly control the number of icons introduced to reduce the project package size and use them as needed
 * 2. Unify the style customization, and keep the icon style consistent within the project
 * 3. Mainly support the introduction of icons in mdx files, and report errors in advance
*/

import { BUILTIN_ICON_COMPONENTS } from '@base-ui/assets';
import { themeIconColor } from '@base-ui/lib/theme-util';
import { getIconConfig } from '@base-ui/lib/icon-config';
import * as limitedIconsModule from '@lib/limited-lucide-icons';
import { type LucideProps } from 'lucide-react';
import React from 'react';

// Type for styled Lucide icon components (accepts LucideProps)
type StyledLucideIconComponent = (props: LucideProps) => React.ReactElement;

// Union type for all icon components (both Lucide and built-in)
type IconComponent = StyledLucideIconComponent | React.ComponentType<LucideProps>;

// Style Lucide icons with global color
const tempStyledLimitedIcons: Partial<Record<keyof typeof limitedIconsModule, StyledLucideIconComponent>> = {};

for (const iconNameKey in limitedIconsModule) {
  if (Object.prototype.hasOwnProperty.call(limitedIconsModule, iconNameKey)) {
    const iconName = iconNameKey as keyof typeof limitedIconsModule;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const OriginalIconComponent = limitedIconsModule[iconName] as any; 

    if (typeof OriginalIconComponent === 'function' || 
        (typeof OriginalIconComponent === 'object' && 
         OriginalIconComponent !== null && 
         OriginalIconComponent.$$typeof === Symbol.for('react.forward_ref'))) {
      const ComponentToRender = OriginalIconComponent as React.ComponentType<LucideProps>;
      
      const StyledIcon = (props: LucideProps): React.ReactElement => {
        const originalClassName = props.className || '';
        // Check if user provided a text color class, if so, don't use global color
        const hasTextColor = /\btext-\w+(-\d+)?\b/.test(originalClassName);
        const newClassName = hasTextColor 
          ? originalClassName 
          : `${themeIconColor} ${originalClassName}`.trim();
        return <ComponentToRender {...props} className={newClassName} />;
      };
      StyledIcon.displayName = `Styled(${iconName})`;
      tempStyledLimitedIcons[iconName] = StyledIcon;
    } else {
      console.warn(`[global-icon.tsx] Skipped styling for "${iconName}" as it is not a function, undefined, or not a recognized React component type. Value:`, OriginalIconComponent);
    }
  }
}

const styledLimitedIconsPart = tempStyledLimitedIcons as {
  [K in keyof typeof limitedIconsModule]: StyledLucideIconComponent;
};

// All icons should be imported from here, and icons will occupy the project package size, so it is best to design and plan in advance
export const globalLucideIcons = {
  ...styledLimitedIconsPart,
  ...BUILTIN_ICON_COMPONENTS, // Spread all built-in icon components
};

// Default fallback icon - centralized configuration
// Use a safe fallback that we know exists in both Lucide and custom icons
const DEFAULT_FALLBACK_ICON = 'BTC' as keyof typeof globalLucideIcons;

/**
 * use iconKey to load icon safely
 * @param iconKey translation or configuration
 * @param createElement whether to return a React element instead of component
 */
export function getGlobalIcon(
  iconKey: string | undefined
): IconComponent;
export function getGlobalIcon(
  iconKey: string | undefined,
  createElement: true
): React.ReactElement | undefined;
export function getGlobalIcon(
  iconKey: string | undefined,
  createElement?: boolean
): IconComponent | React.ReactElement | undefined {
  // Handle undefined iconKey case (for getIconElement compatibility)
  if (!iconKey) {
    if (createElement) {
      return undefined;
    }
    return globalLucideIcons[DEFAULT_FALLBACK_ICON] as IconComponent;
  }
  
  const Icon = globalLucideIcons[iconKey as keyof typeof globalLucideIcons];
  if (!Icon) {
    if (process.env.NODE_ENV !== 'production') {
      // only show in dev|test
      // eslint-disable-next-line no-console
      console.warn(
        `[global-icon] iconKey "${iconKey}" is not defined in globalIcons, will use default "${String(DEFAULT_FALLBACK_ICON)}" icon, please check!`
      );
    }
    const FallbackIcon = globalLucideIcons[DEFAULT_FALLBACK_ICON];
    if (createElement) {
      return React.createElement(FallbackIcon as React.ComponentType<any>);
    }
    return FallbackIcon as IconComponent;
  }
  
  if (createElement) {
    return React.createElement(Icon as React.ComponentType<any>);
  }
  return Icon as IconComponent;
}

/**
 * Get icon element (for fumadocs source compatibility)
 * This is a wrapper around getGlobalIcon for backwards compatibility
 * @param icon icon key from frontmatter
 */
export function getIconElement(
  icon: string | undefined, 
): React.ReactElement | undefined {
  // Note: defaultIconKey parameter is kept for backwards compatibility but ignored
  // The function now uses the centralized DEFAULT_FALLBACK_ICON
  return getGlobalIcon(icon, true);
}

/**
 * render SiteIcon
 * @param configKey 
 * @param className 
 * @param errorMessage
 */
function renderConfiguredIcon(
  configKey: keyof import('@base-ui/lib/icon-config').IconConfig,
  className: string,
  errorMessage: string
): React.ReactElement {
  const configuredIcon = getIconConfig(configKey);
  
  // Only throw error if user completely didn't configure (undefined)
  // If user configured but passed empty string, use default icon
  if (configuredIcon === undefined) {
    // throw error when config is completely missing, avoid legal risks
    throw new Error(errorMessage);
  }
  
  // if configured is a string (icon key name)
  if (typeof configuredIcon === 'string') {
    // if user configured empty string, use default icon
    if (configuredIcon.trim() === '') {
      const DefaultIconComponent = globalLucideIcons[DEFAULT_FALLBACK_ICON];
      return <DefaultIconComponent className={className} />;
    }
    
    const IconComponent = globalLucideIcons[configuredIcon as keyof typeof globalLucideIcons];
    if (!IconComponent) {
      throw new Error(`[${configKey}] Invalid icon key "${configuredIcon}", please check globalLucideIcons for available keys.`);
    }
    return <IconComponent className={className} />;
  }
  
  // if configured is a custom component, wrap it with theme color
  const CustomIconComponent = configuredIcon as React.ComponentType<{ className?: string }>;
  
  // Apply theme color to custom component
  // Check if className already has text color, if so, don't override
  const hasTextColor = /\btext-\w+(-\d+)?\b/.test(className);
  const finalClassName = hasTextColor 
    ? className 
    : `${themeIconColor} ${className}`.trim();
    
  return <CustomIconComponent className={finalClassName} />;
}

// Define the default site icon as a functional component (for export)
export const DefaultSiteIcon = () => (
  <globalLucideIcons.Zap className={`h-8 w-8 rounded-full p-1 shadow-lg ring-0.5 border border-purple-500 ring-purple-500/20 ${themeIconColor}`} />
);

// Define the site icon as a functional component (supports configuration)
export const SiteIcon = () => {
  return renderConfiguredIcon(
    'siteIcon',
    'h-8 w-8 rounded-full p-1 shadow-lg ring-0.5 border border-purple-500 ring-purple-500/20',
    '[SiteIcon] Site icon is not configured. Please use configureIcons({ siteIcon: YourCustomIcon }) or configureIcons({ siteIcon: "IconKeyName" }) to set a custom site icon to avoid legal risks.'
  );
};

// Define 404 not found icon as a functional component (fixed, no configuration)
export const NotFoundIcon = () => (
  <globalLucideIcons.SquareTerminal className={`h-8 w-8 rounded-full p-1 shadow-lg ring-0.5 border border-purple-500 ring-purple-500/20 ${themeIconColor}`} />
); 