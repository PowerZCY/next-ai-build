/* 
 * 针对项目中使用的icon, 进行统一管理
 * 1. 严格控制引入icon数量, 减少项目包大小, 按需使用
 * 2. 统一处理样式定制化, 项目内icon保持风格一致
 * 3. 主要支持mdx文件中引入icon, 报错提前
*/

import React from 'react';
import { type LucideProps } from 'lucide-react';
import Image from 'next/image';

// Revert to wildcard import for lucide icons
import * as limitedIconsModule from '@/lib/limited-lucide-icons';

// Props for the SVG-derived icon components. 
// Making it compatible with LucideProps for easier unification, focusing on className.
interface SvgIconProps {
  className?: string;
  // Add other props if your SVG icons need to be more configurable
}

// Helper function to create SVG-based icon components
function iconFromSVG(src: string, alt: string): (props: SvgIconProps) => React.ReactElement {
  const SvgIconComponent = (props: SvgIconProps): React.ReactElement => {
    // Base className for these SVG icons, combined with any passed className
    const combinedClassName = `size-4.5 ${props.className || ''}`.trim();
    return (
      <Image
        src={src}
        alt={alt}
        className={combinedClassName}
        width={18} // These could also be made configurable via props
        height={18}
      />
    );
  };
  // Set a displayName for better debugging in React DevTools
  SvgIconComponent.displayName = `SvgIcon(${alt.replace(/\s+/g, '_')})`;
  return SvgIconComponent;
}

// 项目内SVG图标 (now these are function components)
const GitHub = iconFromSVG("/icons/github.svg", "GitHub");
const LastUpdated = iconFromSVG("/icons/latest.svg", "Last updated");
const MarkdownX = iconFromSVG("/icons/markdown.svg", "MarkdownX");

type StyledLucideIconComponent = (props: LucideProps) => React.ReactElement;
type CustomSvgIconComponent = (props: SvgIconProps) => React.ReactElement;

// Create styled versions of the lucide icons from the module
const tempStyledLimitedIcons: Partial<Record<keyof typeof limitedIconsModule, StyledLucideIconComponent>> = {};

for (const iconNameKey in limitedIconsModule) {
  if (Object.prototype.hasOwnProperty.call(limitedIconsModule, iconNameKey)) {
    const iconName = iconNameKey as keyof typeof limitedIconsModule;
    const OriginalIconComponent = limitedIconsModule[iconName] as any; // Treat as any for the check

    // Check if it's a function or a React forwardRef component (Corrected Check)
    if (typeof OriginalIconComponent === 'function' || 
        (typeof OriginalIconComponent === 'object' && 
         OriginalIconComponent !== null && 
         OriginalIconComponent.$$typeof === Symbol.for('react.forward_ref'))) {
      const ComponentToRender = OriginalIconComponent as React.ComponentType<LucideProps>;
      
      const StyledIcon = (props: LucideProps): React.ReactElement => {
        const originalClassName = props.className || '';
        const newClassName = `text-purple-500 ${originalClassName}`.trim();
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

// More precise type for globalLucideIcons based on the module exports
type GlobalIconsType = {
  [K in keyof typeof limitedIconsModule]: StyledLucideIconComponent;
} & {
  GitHub: CustomSvgIconComponent;
  LastUpdated: CustomSvgIconComponent;
  MarkdownX: CustomSvgIconComponent;
};

// Object containing globally available icon components
// 所有的图标都要从这里导入, 并且图标会占据项目包的体积, 因此最好提前设计规划好
export const globalLucideIcons = {
  ...styledLimitedIconsPart,
  GitHub,
  LastUpdated,
  MarkdownX
} satisfies GlobalIconsType; // Use satisfies for better type checking without up-casting



