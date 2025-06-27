'use client';

import { createContext, useContext, type ComponentType, type ReactNode } from 'react';

export interface IconConfig {
  siteIcon?: ComponentType | string;
}

// icon config context, directly store the config value
const IconConfigContext = createContext<IconConfig | null>(null);

interface IconConfigProviderProps {
  config: IconConfig;
  children: ReactNode;
}

/**
 * IconConfigProvider - icon config provider based on React Context
 * directly store the config value, without depending on module state
 */
export function IconConfigProvider({ config, children }: IconConfigProviderProps) {
  return (
    <IconConfigContext.Provider value={config}>
      {children}
    </IconConfigContext.Provider>
  );
}

/**
 * internal hook: get icon config
 * not exposed, only used by base-ui internal components
 */
function useIconConfig(): IconConfig {
  const config = useContext(IconConfigContext);
  
  if (config === null) {
    throw new Error(
      '[SiteIcon] IconConfigProvider not found. Please wrap your app with <IconConfigProvider config={{ siteIcon: "YourIcon" }}>.'
    );
  }
  
  return config;
}

/**
 * internal hook: safe get specific icon config
 * not exposed, only used by base-ui internal components
 */
export function useIconConfigSafe(iconKey: keyof IconConfig): ComponentType | string | undefined {
  try {
    const config = useIconConfig();
    return config[iconKey];
  } catch {
    // if there is no provider, return undefined, let the caller handle it
    return undefined;
  }
} 