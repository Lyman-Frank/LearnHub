/* eslint-disable no-var */
export {};

declare global {
  interface Window {
    customAlert: (message?: string) => void;
    customConfirm: (message?: string) => Promise<boolean>;
    customPrompt: (message?: string, defaultValue?: string) => Promise<string | null>;
  }
}
