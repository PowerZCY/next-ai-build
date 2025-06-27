import React from 'react';

export interface IconConfig {
  // SiteIcon, support custom component or globalLucideIcons key
  siteIcon?: React.ComponentType | string;
}

// global config storage
let globalIconConfig: IconConfig = {};

/**
 * configure custom icon
 * @param config
 */
export function configureIcons(config: IconConfig): void {
  globalIconConfig = { ...globalIconConfig, ...config };
}

/**
 * get configured icon
 * @param iconKey
 * @returns configured icon component or icon name
 */
export function getIconConfig(iconKey: keyof IconConfig): React.ComponentType | string | undefined {
  return globalIconConfig[iconKey];
}

/**
 * clear icon config (mainly for testing)
 */
export function clearIconConfig(): void {
  globalIconConfig = {};
}

/**
 * get current full config (for debugging)
 */
export function getFullIconConfig(): IconConfig {
  return { ...globalIconConfig };
} 