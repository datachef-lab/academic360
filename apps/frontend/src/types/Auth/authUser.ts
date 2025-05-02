export interface AuthUser {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    roles?: string[];
    // Add other user properties as needed
  }
  
  export interface AuthContextType {
    user: AuthUser | null;
    login: (accessToken: string, userData: AuthUser) => void;
    logout: () => void;
    accessToken: string | null;
    displayFlag: boolean;
  }