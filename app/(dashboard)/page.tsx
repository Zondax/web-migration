'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { observer, use$ } from '@legendapp/state/react';
import { ledgerState$ } from 'app/state/ledger';
import { StepValue } from 'app/state/types/ui';
import { uiState$ } from 'app/state/ui';
import { Check } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import AppsTable from './apps-table';
import ConnectTab from './connect-tab';

function ProductsPage() {
  const steps = use$(uiState$.steps);
  const [activeStep, setActiveStep] = useState<StepValue>('connect-device');

  const isDeviceConnected = ledgerState$.device.connection.get();
  const isAppOpen = ledgerState$.device.connection?.genericApp?.get();
  const isSynchronized = ledgerState$.apps.status.get() === 'synchronized';

  // Update steps completion status
  useEffect(() => {
    uiState$.steps.set((prev) =>
      prev.map((step) => {
        switch (step.value) {
          case 'connect-device':
            return {
              ...step,
              isComplete: Boolean(isDeviceConnected && isAppOpen)
            };
          case 'synchronize-accounts':
            return { ...step, isComplete: isSynchronized };
          case 'migrate':
            return { ...step, isComplete: false }; // TODO: Add migration completion check
          default:
            return step;
        }
      })
    );
  }, [isDeviceConnected, isAppOpen, isSynchronized]);

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

  useEffect(() => {
    uiState$.loadInitialIcons();
  }, []);

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
