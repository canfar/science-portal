export interface ThemeToggleProps {
  /** Size of the toggle button */
  size?: 'sm' | 'md' | 'lg';
  /** Show text label alongside icon */
  showLabel?: boolean;
  /** Custom label text for light mode */
  lightLabel?: string;
  /** Custom label text for dark mode */
  darkLabel?: string;
}
