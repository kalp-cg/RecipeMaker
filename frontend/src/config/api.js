/**
 * Centralized API configuration.
 * Single source of truth — imported by all components that call the backend.
 */
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
