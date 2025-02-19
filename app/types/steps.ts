export type StepValue = 'connect-device' | 'synchronize-accounts' | 'migrate';

export interface Step {
  value: StepValue;
  label: string;
  isComplete: boolean;
}
