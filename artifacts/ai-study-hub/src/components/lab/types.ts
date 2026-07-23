export interface LabSimProps {
  onComplete?: (score: number, data: Record<string, unknown>) => void;
  level?: 1 | 2 | 3;
}
