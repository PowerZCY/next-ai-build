import { FingerprintConfig } from '@third-ui/clerk/fingerprint';

export const fingerprintConfig: FingerprintConfig = {
  apiEndpoint: '/api/user/anonymous/init',
  autoInitialize: true,
};