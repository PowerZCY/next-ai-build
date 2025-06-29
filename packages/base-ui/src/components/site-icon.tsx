'use client';

import { type LucideProps } from 'lucide-react';
import { cn } from '@lib/utils';
import { useIconConfigSafe } from '@base-ui/components/icon-context';
import { globalLucideIcons } from '@base-ui/components/global-icon';
import { themeIconColor } from '@base-ui/lib/theme-util';

/**
 * site icon component - client component
 * based on React Context to get the config, solve the problem of cross-package module instance isolation
 */
export function SiteIcon({ 
  size = 24, 
  className,
  ...props 
}: Omit<LucideProps, 'children'>) {
  const configuredIcon = useIconConfigSafe('siteIcon');
  
  if (configuredIcon === undefined) {
    throw new Error(
      '[SiteIcon] Site icon is not configured. Please use <IconConfigProvider config={{ siteIcon: YourCustomIcon }}> or <IconConfigProvider config={{ siteIcon: "IconKeyName" }}> to set a custom site icon to avoid legal risks.'
    );
  }

  // render the icon, pass in the config value and attributes
  if (typeof configuredIcon === 'string') {
    // string type: the key name of globalLucideIcons
    if (configuredIcon === '') {
      // empty string use default icon
      const DefaultIcon = globalLucideIcons['Download' as keyof typeof globalLucideIcons];
      return <DefaultIcon size={size} className={cn(themeIconColor, className)} {...props} />;
    }
    const IconComponent = globalLucideIcons[configuredIcon as keyof typeof globalLucideIcons];
    if (!IconComponent) {
      throw new Error(`[SiteIcon] Icon key "${configuredIcon}" not found in globalLucideIcons.`);
    }
    return <IconComponent size={size} className={cn(themeIconColor, className)} {...props} />;
  } else {
    // React component type: custom icon component
    const CustomIcon = configuredIcon as React.ComponentType<LucideProps>;
    const hasColorClass = className && /text-\w+/.test(className);
    const finalClassName = hasColorClass ? className : cn(themeIconColor, className);
    return <CustomIcon size={size} className={finalClassName} {...props} />;
  }
} 