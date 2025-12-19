export interface UserMenuProps {
  /**
   * The user's display name (shown when authenticated)
   */
  userName?: string;
  /**
   * Whether the user is authenticated
   */
  isAuthenticated: boolean;
  /**
   * Callback when login button is clicked
   */
  onLogin?: () => void;
  /**
   * Callback when logout is clicked
   */
  onLogout?: () => void;
  /**
   * Callback when "Update Profile" is clicked
   */
  onUpdateProfile?: () => void;
  /**
   * Callback when "Reset Password" is clicked
   */
  onResetPassword?: () => void;
  /**
   * Callback when "Obtain Certificate" is clicked
   */
  onObtainCertificate?: () => void;
}
