export interface CanfarRangeProps {
  value: number;
  min: number;
  max: number;
  /** Increment per slider tick. Defaults to 1 for granular control. */
  step?: number;
  /** Fires continuously during drag. Keep this side cheap. */
  onChange: (value: number) => void;
  /** Fires once when the user releases the slider — wire this to expensive writes. */
  onChangeCommitted?: (value: number) => void;
  disabled?: boolean;
  label?: string;
}
