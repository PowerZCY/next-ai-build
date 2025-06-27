/* 
 * For the icon used in the project, unified management is required
 * 1. Strictly control the number of icons introduced to reduce the project package size and use them as needed
 * 2. Unify the style customization, and keep the icon style consistent within the project
 * 3. Mainly support the introduction of icons in mdx files, and report errors in advance
*/

import React from 'react';
import { type LucideProps } from 'lucide-react';
import Image from 'next/image';
import * as limitedIconsModule from '@lib/limited-lucide-icons';

// Attention: This icon color will be used in the entire project, and it depends on the ENV variable NEXT_PUBLIC_STYLE_ICON_COLOR
const iconColor = process.env.NEXT_PUBLIC_STYLE_ICON_COLOR || "text-purple-500";

// Define all custom image-based icons in this object
const customImageIcons = {
  GitHub: iconFromSVG("/icons/github.svg", "GitHub"),
  LastUpdated: iconFromSVG("/icons/latest.svg", "Last updated"),
  Markdown: iconFromSVG("/icons/markdown.svg", "Markdown"),
  MDX: iconFromSVG("/icons/mdx.svg", "MDX"),
  Snippets: iconFromSVG("/icons/snippets.svg", "Snippets"),
  D8: iconFromSVG("/icons/D8.svg", "D8"),
  MAC: iconFromSVG("/icons/apple.svg", "Mac"),
  Iterm: iconFromSVG("/icons/iterm.svg", "Iterm"),
  BTC: iconFromSVG("/icons/bitcoin.svg", "BTC"),
  DPA: iconFromSVG("/icons/dpa.svg", "DPA"),
  SubP: iconFromSVG("/icons/subp.svg", "SubP"),
  T3P: iconFromSVG("/icons/3rdP.svg", "T3P"),
  Clerk: iconFromSVG("/icons/clerk.svg", "Clerk"),
  Mmd: iconFromSVG("/icons/mermaid.svg", "Mermaid", 16, 16),
  Test: iconFromSVG("/icons/test.svg", "Test"),
  Diff: iconFromSVG("/icons/diff.svg", "Diff"),
  Html: iconFromSVG("/icons/html.svg", "Html"),
  Http: iconFromSVG("/icons/http.svg", "Http"),
  Java: iconFromSVG("/icons/java.svg", "Java"),
  Json: iconFromSVG("/icons/json.svg", "Json"),
  Log: iconFromSVG("/icons/log.svg", "Log"),
  Scheme: iconFromSVG("/icons/scheme.svg", "Scheme"),
  SQL: iconFromSVG("/icons/sql.svg", "SQL"),
  CSS: iconFromSVG("/icons/tailwindcss.svg", "CSS"),
  XML: iconFromSVG("/icons/xml.svg", "XML"),
  Yaml: iconFromSVG("/icons/yaml.svg", "Yaml"),
  CSV: iconFromSVG("/icons/csv.svg", "CSV"),
  Txt: iconFromSVG("/icons/txt.svg", "Txt"),
};

// Helper function to create SVG-based icon components, now accepting LucideProps
function iconFromSVG(
  src: string,
  alt: string,
  defaultIconWidth?: number, // Optional: default width for this specific icon type
  defaultIconHeight?: number // Optional: default height for this specific icon type
): (props: LucideProps) => React.ReactElement {
  const SvgIconComponent = (props: LucideProps): React.ReactElement => {
    // Fallback dimensions if no defaults are provided to iconFromSVG
    const fallbackWidth = 18;
    const fallbackHeight = 18;

    let width: number;
    let height: number;

    // Priority:
    // 1. props.size (if number)
    // 2. defaultIconWidth/Height from iconFromSVG call
    // 3. Fallback (18x18)
    if (typeof props.size === 'number') {
      width = props.size;
      height = props.size;
    } else {
      width = defaultIconWidth ?? fallbackWidth;
      // If defaultIconHeight is not given, use defaultIconWidth if available, otherwise fallbackHeight
      height = defaultIconHeight ?? defaultIconWidth ?? fallbackHeight;
    }
    
    // className is purely from props. No default "size-4.5" anymore from here.
    const imageClassName = props.className || ''; 

    return (
      <Image
        src={src}
        alt={alt}
        className={imageClassName}
        width={width}  // Use the determined width
        height={height} // Use the determined height
      />
    );
  };
  SvgIconComponent.displayName = `SvgIcon(${alt.replace(/\s+/g, '_')})`;
  return SvgIconComponent;
}

// Type for styled Lucide icon components (accepts LucideProps)
type StyledLucideIconComponent = (props: LucideProps) => React.ReactElement;

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
          : `${iconColor} ${originalClassName}`.trim();
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

// GlobalIconsType now dynamically combines types from Lucide module and custom image icons
type GlobalIconsType = 
  { [K in keyof typeof limitedIconsModule]: StyledLucideIconComponent } &
  { [K in keyof typeof customImageIcons]: StyledLucideIconComponent };

// All icons should be imported from here, and icons will occupy the project package size, so it is best to design and plan in advance
export const globalLucideIcons = {
  ...styledLimitedIconsPart,
  ...customImageIcons, // Spread all custom image icons
} satisfies GlobalIconsType; // Use satisfies for better type checking without up-casting

/**
 * use iconKey to lode icon safety
 * @param iconKey translation or configuration
 * @param fallbackKey default as 'BTC'
 */
export function getGlobalIcon(
  iconKey: string,
  fallbackKey: keyof typeof globalLucideIcons = 'BTC'
) {
  const Icon = globalLucideIcons[iconKey as keyof typeof globalLucideIcons];
  if (!Icon) {
    if (process.env.NODE_ENV !== 'production') {
      // 只在开发环境警告
      // eslint-disable-next-line no-console
      console.warn(
        `[global-icon] iconKey "${iconKey}" is not defined in globalIcons, please check!`
      );
    }
    return globalLucideIcons[fallbackKey];
  }
  return Icon;
}

// Define the site icon as a functional component
export const SiteIcon = () => (
  <globalLucideIcons.Zap className={`h-8 w-8 rounded-full p-1 shadow-lg ring-0.5 border border-purple-500 ring-purple-500/20 ${iconColor}`} />
);

// Define 404 not found icon as a functional component
export const NotFoundIcon = () => (
  <globalLucideIcons.SquareTerminal className={`h-8 w-8 rounded-full p-1 shadow-lg ring-0.5 border border-purple-500 ring-purple-500/20 ${iconColor}`} />
);