/**
 * Partner Management Module - Mobile UI Entry
 * 
 * @description Exports all public components and API
 * @version 3.0.0
 */

// Type exports
export * from './types';

// API exports
export { partnerApi, setApiBase } from './api';

// Component exports
export { PartnerList } from './components/PartnerList';

// Default export
export default {
  name: '@shinwa/partners-ui-mobile',
  version: '3.0.0',
};
