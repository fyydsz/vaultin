/**
 * Environment configuration helper
 * Checks whether the application is running in Preview Mode (Under Development/Pre-production)
 */
export const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV || "preview";
export const IS_PREVIEW = APP_ENV === "preview";
