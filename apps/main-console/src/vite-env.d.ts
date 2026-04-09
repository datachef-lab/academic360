/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_BACKEND_URL: string;
  /** Full URL to login hero image; overrides settings "Login Screen Image" when set */
  readonly VITE_LOGIN_SCREEN_IMAGE_URL?: string;
  readonly VITE_COLLEGE_NAME?: string;
  readonly VITE_COLLEGE_ABBREVIATION?: string;
}
