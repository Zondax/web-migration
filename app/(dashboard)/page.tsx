'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { observer } from '@legendapp/state/react';
import { uiState$ } from 'app/state/ui';
import { Step, StepValue } from 'app/types/steps';
import { Check } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import AppsTable from './apps-table';
import ConnectTab from './connect-tab';

function ProductsPage() {
  const [steps, setSteps] = useState<Step[]>([
    { value: 'connect-device', label: 'Connect Device', isComplete: false },
    {
      value: 'synchronize-accounts',
      label: 'Synchronize Accounts',
      isComplete: false
    },
    { value: 'migrate', label: 'Migrate', isComplete: false }
  ]);
  const [activeStep, setActiveStep] = useState<StepValue>('connect-device');

  const isDeviceConnected = uiState$.device.isConnected.get();
  const isSynchronized = uiState$.apps.status.get() === 'synchronized';

  // Update steps completion status
  useEffect(() => {
    setSteps((prev) =>
      prev.map((step) => {
        switch (step.value) {
          case 'connect-device':
            return { ...step, isComplete: isDeviceConnected };
          case 'synchronize-accounts':
            return { ...step, isComplete: isSynchronized };
          case 'migrate':
            return { ...step, isComplete: false }; // TODO: Add migration completion check
          default:
            return step;
        }
      })
    );
  }, [isDeviceConnected, isSynchronized]);

  // Auto-advance to next step when current step is completed
  useEffect(() => {
    const currentStepIndex = steps.findIndex(
      (step) => step.value === activeStep
    );
    const currentStep = steps[currentStepIndex];
    const nextStep = steps[currentStepIndex + 1];

    if (currentStep?.isComplete && nextStep) {
      setActiveStep(nextStep.value);
    }
  }, [steps, activeStep]);

  const handleTabChange = useCallback((value: string) => {
    setActiveStep(value as StepValue);
  }, []);

  const getStepStatus = (stepValue: StepValue) => {
    const step = steps.find((s) => s.value === stepValue);
    const currentIndex = steps.findIndex((s) => s.value === activeStep);
    const stepIndex = steps.findIndex((s) => s.value === stepValue);

    return {
      disabled: stepIndex > currentIndex && !steps[stepIndex - 1]?.isComplete,
      isComplete: step?.isComplete
    };
  };

  return (
    <Tabs value={activeStep} onValueChange={handleTabChange}>
      <div className="flex items-center">
        <TabsList>
          {steps.map((step) => {
            const { disabled, isComplete } = getStepStatus(step.value);
            return (
              <TabsTrigger
                key={step.value}
                value={step.value}
                disabled={disabled}
                className="flex items-center gap-2"
              >
                {step.label}
                {isComplete && <Check className="h-4 w-4" />}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>
      <TabsContent value="connect-device">
        <ConnectTab />
      </TabsContent>
      <TabsContent value="synchronize-accounts">
        <AppsTable mode="synchronize" />
      </TabsContent>
      <TabsContent value="migrate">
        <AppsTable mode="migrate" />
      </TabsContent>
    </Tabs>
  );
}

export default observer(ProductsPage);
