'use client';

import { useEffect, useState } from 'react';
import { Joyride, EventData, STATUS, Step, EVENTS } from 'react-joyride';

interface ProformaTourProps {
  run: boolean;
  onFinish: () => void;
}

export function ProformaTour({ run, onFinish }: ProformaTourProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const steps: Step[] = [
    {
      target: '#tour-project-name',
      placement: 'bottom',
      title: '1. Project Name',
      content: 'Start by giving your quote a clear and descriptive name to easily identify it later.',
    },
    {
      target: '#tour-client-details',
      title: '2. Assign a Client',
      content: 'Every quote needs a recipient. You can search for an existing client or create a new one on the fly here.',
      placement: 'bottom',
    },
    {
      target: '#tour-project-details',
      title: '3. Project Details & Schedule',
      content: 'Set the project name, validity period, and any scheduling details if this is a direct service job.',
      placement: 'bottom',
    },
    {
      target: '#tour-line-items',
      title: '4. Quote Items',
      content: 'Here you can detail all your products and services. Let us show you how to configure them.',
      placement: 'top',
    },
    {
      target: '.tour-item-drag',
      title: '5. Reorder Items',
      content: 'Grab this handle to drag and drop items to reorder them in your quote.',
      placement: 'right',
    },
    {
      target: '.tour-item-name',
      title: '6. Item Details',
      content: 'Enter the product or service name. You can also search your catalog for frequently used items.',
      placement: 'bottom',
    },
    {
      target: '.tour-item-price',
      title: '7. Cost & Markup Calculator',
      content: 'Click inside the unit price to reveal a popover calculator. You can enter your base cost and let the system calculate the final price with markup!',
      placement: 'bottom',
    },
    {
      target: '.tour-item-optional',
      title: '8. Optional Items',
      content: 'Check this to present the item as an optional add-on. It won\'t be added to the total unless the client approves it.',
      placement: 'top',
    },
    {
      target: '#tour-item-add',
      title: '9. Add More Items',
      content: 'Click here to add another product or service to your quote.',
      placement: 'top',
    },
    {
      target: '#tour-adjustments',
      title: '10. Finalize & Save',
      content: 'Apply discounts, calculate taxes, and set a required deposit before you save the quote.',
      placement: 'top',
    }
  ];

  const handleJoyrideCallback = (data: EventData) => {
    const { status, type, step } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      onFinish();
    }

    // Manually center the target element on the screen when the step starts
    if (type === EVENTS.TOOLTIP || type === EVENTS.STEP_BEFORE) {
      if (typeof step.target === 'string') {
        const targetElement = document.querySelector(step.target);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  };

  if (!mounted) return null;

  return (
    <Joyride
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
        skipScroll: true,
        buttons: ['back', 'close', 'primary', 'skip'],
      }}
      styles={{
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltipTitle: {
          fontFamily: 'Archivo Black',
          fontSize: '18px',
          marginBottom: '8px',
        },
        tooltipContent: {
          fontFamily: 'Manrope',
          fontSize: '14px',
          color: 'var(--muted-foreground)',
        },
        buttonPrimary: {
          backgroundColor: 'var(--primary)',
          borderRadius: '8px',
          padding: '8px 16px',
          fontFamily: 'Manrope',
          fontWeight: 700,
        },
        buttonBack: {
          marginRight: 10,
          fontFamily: 'Manrope',
          fontWeight: 600,
        },
        buttonSkip: {
          fontFamily: 'Manrope',
          fontWeight: 600,
        }
      }}
    />
  );
}
