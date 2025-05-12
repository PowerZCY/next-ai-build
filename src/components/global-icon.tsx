/* 
 * 针对项目中使用的icon, 进行统一管理
 * 1. 严格控制引入icon数量, 减少项目包大小, 按需使用
 * 2. 统一处理样式定制化, 项目内icon保持风格一致
 * 3. 主要支持mdx文件中引入icon, 报错提前
*/

import React from 'react';
import { type LucideProps } from 'lucide-react';
import Image from 'next/image';
import * as limitedIconsModule from '@/lib/limited-lucide-icons';
import { iconColor } from '@/lib/appConfig';

// Define all custom image-based icons in this object
const customImageIcons = {
  GitHub: iconFromSVG("/icons/github.svg", "GitHub"),
  LastUpdated: iconFromSVG("/icons/latest.svg", "Last updated"),
  MarkdownX: iconFromSVG("/icons/markdown.svg", "MarkdownX"),
  Snippets: iconFromSVG("/icons/snippets.svg", "Snippets"),
  D8: iconFromSVG("/icons/D8.svg", "D8"),
  Mmd: iconFromSVG("/icons/mermaid.svg", "Mermaid"),
  Test: iconFromSVG("/icons/test.svg", "Test"),
  Diff: iconFromSVG("/icons/diff.svg", "Diff"),
  Html: iconFromSVG("/icons/html.svg", "Html"),
  Http: iconFromSVG("/icons/http.svg", "Http"),
  Java: iconFromSVG("/icons/java.svg", "Java"),
  Json: iconFromSVG("/icons/json.svg", "Json"),
  Jsonc: iconFromSVG("/icons/jsonc.svg", "Jsonc"),
  Log: iconFromSVG("/icons/log.svg", "Log"),
  Scheme: iconFromSVG("/icons/scheme.svg", "Scheme"),
  SQL: iconFromSVG("/icons/sql.svg", "SQL"),
  CSS: iconFromSVG("/icons/tailwindcss.svg", "CSS"),
  XML: iconFromSVG("/icons/xml.svg", "XML"),
  Yaml: iconFromSVG("/icons/yaml.svg", "Yaml"),
  CSV: iconFromSVG("/icons/csv.svg", "CSV"),
};

// Helper function to create SVG-based icon components, now accepting LucideProps
function iconFromSVG(src: string, alt: string): (props: LucideProps) => React.ReactElement {
  const SvgIconComponent = (props: LucideProps): React.ReactElement => {
    // We primarily use className from LucideProps. Other props like size, color specific to SVG paths
    // won't directly affect the <Image /> unless explicitly handled.
    const combinedClassName = `size-4.5 ${props.className || ''}`.trim();
    return (
      <Image
        src={src}
        alt={alt}
        className={combinedClassName}
        width={18} // Fixed width for image-based icons
        height={18} // Fixed height for image-based icons
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
        const newClassName = `${iconColor} ${originalClassName}`.trim(); // User changed to 500
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

// Object containing globally available icon components
// 所有的图标都要从这里导入, 并且图标会占据项目包的体积, 因此最好提前设计规划好
export const globalLucideIcons = {
  ...styledLimitedIconsPart,
  ...customImageIcons, // Spread all custom image icons
} satisfies GlobalIconsType; // Use satisfies for better type checking without up-casting

// Define the site icon as a functional component
export const SiteIcon = () => (
  <globalLucideIcons.Zap className={`h-8 w-8 rounded-full p-1 shadow-lg ring-0.5 border border-purple-500 ring-purple-500/20 ${iconColor}`} />
);

