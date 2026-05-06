export interface ResourceFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  /** Fires only when the value is committed (slider release or input commit). */
  onChange: (value: number) => void;
  disabled?: boolean;
}
