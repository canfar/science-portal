export interface CanfarRangeProps {
  value: number;
  range: number[];
  onChange: (value: number) => void;
  disabled?: boolean;
  label?: string;
}
