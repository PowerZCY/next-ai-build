/**
 * Fingerprint System Types
 * 指纹识别系统的类型定义
 */

export interface AnonymousUser {
  userId: string;
  fingerprintId: string;
  clerkUserId: string,
  email: string,
  status: string;
  createdAt: string;
}

export interface Credits {
  balanceFree: number;
  balancePaid: number;
  totalBalance: number;
}

export interface FingerprintConfig {
  /** API endpoint for anonymous user initialization */
  apiEndpoint: string;
  /** Whether to automatically initialize the user on load */
  autoInitialize?: boolean;
  /** Initial credits for new users */
  initialCredits?: number;
}

export interface UseFingerprintResult {
  fingerprintId: string | null;
  anonymousUser: AnonymousUser | null;
  credits: Credits | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  initializeAnonymousUser: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

export interface FingerprintContextType extends UseFingerprintResult {}

export interface FingerprintProviderProps {
  children: React.ReactNode;
  config: FingerprintConfig;
}
// Fetch wrapper type
export interface FingerprintFetch {
  (url: string | URL | Request, init?: RequestInit): Promise<Response>;
}