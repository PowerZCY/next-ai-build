import { type LucideProps } from 'lucide-react';
import { cn } from '@lib/utils';
import { globalLucideIcons } from '@base-ui/components/global-icon';
import { themeIconColor } from '@base-ui/lib/theme-util';

/**
 * Create a SiteIcon component with specific configuration
 * This function helps avoid React multi-instance issues by creating the icon component
 * at the application level with explicit configuration
 */
export function createSiteIcon(iconConfig: string | React.ComponentType<LucideProps>) {
  return function CreatedSiteIcon({ 
    size = 24, 
    className,
    ...props 
  }: Omit<LucideProps, 'children'>) {
    // render the icon, pass in the config value and attributes
    if (typeof iconConfig === 'string') {
      // string type: the key name of globalLucideIcons
      if (iconConfig === '') {
        // empty string use default icon
        const DefaultIcon = globalLucideIcons['Download' as keyof typeof globalLucideIcons];
        return <DefaultIcon size={size} className={cn(themeIconColor, className)} {...props} />;
      }
      const IconComponent = globalLucideIcons[iconConfig as keyof typeof globalLucideIcons];
      if (!IconComponent) {
        throw new Error(`[CreatedSiteIcon] Icon key "${iconConfig}" not found in globalLucideIcons.`);
      }
      return <IconComponent size={size} className={cn(themeIconColor, className)} {...props} />;
    } else {
      // React component type: custom icon component
      const CustomIcon = iconConfig as React.ComponentType<LucideProps>;
      const hasColorClass = className && /text-\w+/.test(className);
      const finalClassName = hasColorClass ? className : cn(themeIconColor, className);
      return <CustomIcon size={size} className={finalClassName} {...props} />;
    }
  };
} 