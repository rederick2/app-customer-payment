'use client';

import { useState, useEffect } from 'react';
import { Joyride, EventData, STATUS, Step, EVENTS } from 'react-joyride';

interface JobTourProps {
  run: boolean;
  onFinish: () => void;
  onStepChange?: (tab: string) => void;
}

export function JobTour({ run, onFinish, onStepChange }: JobTourProps) {
  const [mounted, setMounted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (run) {
      setStepIndex(0);
      if (onStepChange) onStepChange('items');
    }
  }, [run]);

  const steps: Step[] = [
    {
      target: '#tour-job-overview',
      placement: 'bottom',
      title: '1. Job Overview',
      content: 'Track the financial health, profit margin, and total cost of this job at a glance.',
      skipBeacon: true,
    },
    {
      target: '#tour-job-actions',
      title: '2. Job Actions',
      content: 'Change the job status, collect signatures, or generate PDF documents from here.',
      placement: 'bottom',
      skipBeacon: true,
    },
    {
      target: '#tour-job-tabs',
      title: '3. Navigation Tabs',
      content: 'Switch between viewing Job Items, tracking Progress, managing Financials, or reviewing Materials.',
      placement: 'bottom',
      skipBeacon: true,
    },
    {
      target: '#tour-tab-items',
      title: '4. Items Tab',
      content: 'Here you can view and manage the original line items from the approved quote.',
      placement: 'bottom',
      skipBeacon: true,
    },
    {
      target: '#tour-job-items',
      title: '5. Line Items',
      content: 'Review items, mark them as complete, and track actual vs estimated costs.',
      placement: 'top',
      skipBeacon: true,
    },
    {
      target: '#tour-btn-new-item',
      title: '6. Add Line Item',
      content: 'Need to add extras or change orders? Add new line items directly to the job here.',
      placement: 'bottom',
      skipBeacon: true,
    },
    {
      target: '#tour-tab-work',
      title: '7. Progress Tab',
      content: 'This section helps you manage the execution of the job.',
      placement: 'bottom',
      skipBeacon: true,
    },
    {
      target: '#tour-job-progress',
      title: '8. Tasks & Punch List',
      content: 'Create checklists, manage to-dos, and assign tasks to your team members.',
      placement: 'top',
      skipBeacon: true,
    },
    {
      target: '#tour-btn-new-task',
      title: '9. Add Task',
      content: 'Click here to add a new task to your punch list.',
      placement: 'bottom',
      skipBeacon: true,
    },
    {
      target: '#tour-job-labor',
      title: '10. Labor Tracking',
      content: 'Track employee hours dedicated to this job to calculate labor costs against your margin.',
      placement: 'top',
      skipBeacon: true,
    },
    {
      target: '#tour-btn-new-labor',
      title: '11. Log Time',
      content: 'Add time entries for your crew members here.',
      placement: 'bottom',
      skipBeacon: true,
    },
    {
      target: '#tour-tab-finance',
      title: '12. Financials Tab',
      content: 'Manage the money coming in and going out for this specific job.',
      placement: 'bottom',
      skipBeacon: true,
    },
    {
      target: '#tour-job-finance',
      title: '13. Payments Received',
      content: 'Track all payments collected from the customer to see the outstanding balance.',
      placement: 'top',
      skipBeacon: true,
    },
    {
      target: '#tour-btn-new-payment',
      title: '14. Record Payment',
      content: 'When a customer pays, record it here to update the job balance.',
      placement: 'bottom',
      skipBeacon: true,
    },
    {
      target: '#tour-job-invoices',
      title: '15. Invoices',
      content: 'Generate and send PDF invoices to the client for progress billing or final payment.',
      placement: 'top',
      skipBeacon: true,
    },
    {
      target: '#tour-tab-materials',
      title: '16. Materials Tab',
      content: 'Manage your shopping lists and track material purchases.',
      placement: 'bottom',
      skipBeacon: true,
    },
    {
      target: '#tour-btn-add-materials',
      title: '17. Add Materials',
      content: 'Use AI to auto-generate material lists based on Home Depot prices, or add them manually.',
      placement: 'left',
      skipBeacon: true,
    }
  ];

  const handleJoyrideCallback = (data: EventData) => {
    const { status, type, step, index, action } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setStepIndex(0);
      onFinish();
      return;
    }

    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      const nextStepIndex = index + (action === 'prev' ? -1 : 1);
      const nextStepTarget = steps[nextStepIndex]?.target;

      if (onStepChange && typeof nextStepTarget === 'string') {
        if (nextStepTarget.includes('items') || nextStepTarget.includes('new-item')) onStepChange('items');
        else if (nextStepTarget.includes('work') || nextStepTarget.includes('progress') || nextStepTarget.includes('task') || nextStepTarget.includes('labor')) onStepChange('work');
        else if (nextStepTarget.includes('finance') || nextStepTarget.includes('payment') || nextStepTarget.includes('invoice')) onStepChange('finance');
        else if (nextStepTarget.includes('materials')) onStepChange('materials');
      }

      // Small delay to allow the DOM to render the newly activated tab content
      setTimeout(() => {
        setStepIndex(nextStepIndex);
      }, 150);
    }

    // Manually center the target element on the screen when the step starts
    if (type === EVENTS.TOOLTIP) {
      if (typeof step.target === 'string') {
        const targetElement = document.querySelector(step.target);
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }
    }
  };

  if (!mounted) return null;

  return (
    <Joyride
      stepIndex={stepIndex}
      steps={steps}
      run={run}
      continuous={true}
      scrollToFirstStep={true}
      onEvent={handleJoyrideCallback}
      options={{
        zIndex: 10000,
        primaryColor: 'var(--primary)',
        textColor: 'var(--foreground)',
        backgroundColor: 'var(--card)',
        arrowColor: 'var(--card)',
        overlayColor: 'rgba(0, 0, 0, 0.6)',
        showProgress: true,
        buttons: ['back', 'close', 'primary', 'skip'],
      }}
      styles={{
        tooltip: {
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
          border: '1px solid var(--border)',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltipTitle: {
          fontSize: '18px',
          fontWeight: 900,
          fontFamily: 'var(--font-archivo), system-ui, sans-serif',
          marginBottom: '8px',
          color: 'var(--foreground)',
        },
        tooltipContent: {
          fontSize: '14px',
          padding: '0',
          color: 'var(--muted-foreground)',
          lineHeight: '1.6',
        },
        buttonPrimary: {
          backgroundColor: 'var(--primary)',
          color: 'var(--primary-foreground)',
          borderRadius: '12px',
          padding: '10px 20px',
          fontWeight: 900,
          fontSize: '14px',
          textTransform: 'none',
          transition: 'all 0.2s ease',
        },
        buttonBack: {
          color: 'var(--primary)',
          fontWeight: 900,
          fontSize: '14px',
          marginRight: '12px',
        },
        buttonSkip: {
          color: 'var(--muted-foreground)',
          fontWeight: 800,
          fontSize: '14px',
        },
      }}
    />
  );
}
