/**
 * Imperative alert API for use outside of React components
 * This creates a temporary root and mounts the alert dialog imperatively
 */

import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Spinner } from '@/components/ui/spinner';

type AlertType = 'success' | 'error' | 'warning' | 'info' | 'question';

interface AlertConfig {
  title: string;
  text?: string;
  html?: string;
  icon?: AlertType;
  showCancelButton?: boolean;
  showCloseButton?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
  focusConfirm?: boolean;
  input?: 'text' | 'datetime-local';
  inputValue?: string;
  inputLabel?: string;
  inputPlaceholder?: string;
  inputAttributes?: Record<string, any>;
  inputValidator?: (value: string) => Promise<string | null> | string | null;
  preConfirm?: (value?: string) => Promise<any> | any;
  allowOutsideClick?: boolean;
  allowEscapeKey?: boolean;
  showConfirmButton?: boolean;
}

interface AlertResult {
  isConfirmed: boolean;
  isDismissed: boolean;
  isDenied: boolean;
  value?: any;
}

const getIconColor = (icon?: AlertType) => {
  switch (icon) {
    case 'success':
      return 'text-green-500';
    case 'error':
      return 'text-red-500';
    case 'warning':
      return 'text-yellow-500';
    case 'info':
      return 'text-blue-500';
    case 'question':
      return 'text-purple-500';
    default:
      return '';
  }
};

const getIconSymbol = (icon?: AlertType) => {
  switch (icon) {
    case 'success':
      return '✓';
    case 'error':
      return '✕';
    case 'warning':
      return '⚠';
    case 'info':
      return 'ℹ';
    case 'question':
      return '?';
    default:
      return null;
  }
};

export const alert = {
  fire: (config: AlertConfig): Promise<AlertResult> => {
    console.log('[ImperativeAlert] fire() called with config:', config.title);
    return new Promise((resolve) => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      console.log('[ImperativeAlert] Container created and appended to body');
      const root = createRoot(container);

      let inputValue = config.inputValue || '';
      let validationError = '';

      const cleanup = () => {
        root.unmount();
        if (container.parentNode === document.body) {
          document.body.removeChild(container);
        }
      };

      const handleConfirm = async () => {
        if (config.input && config.inputValidator) {
          const error = await config.inputValidator(inputValue);
          if (error) {
            validationError = error;
            render();
            return;
          }
        }

        let result: any = inputValue;
        if (config.preConfirm) {
          result = await config.preConfirm(inputValue);
        }

        cleanup();
        resolve({ isConfirmed: true, isDismissed: false, isDenied: false, value: result });
      };

      const handleCancel = () => {
        cleanup();
        resolve({ isConfirmed: false, isDismissed: true, isDenied: false });
      };

      const render = () => {
        console.log('[ImperativeAlert] render() called');
        const showLoading = config.showConfirmButton === false;

        root.render(
          createElement(AlertDialog, { open: true, onOpenChange: (open: boolean) => !open && handleCancel() },
            createElement(AlertDialogContent, { className: 'bg-stone-800 border-stone-700 text-white' },
              createElement(AlertDialogHeader, null,
                createElement(AlertDialogTitle, { className: 'flex items-center justify-center gap-3 text-xl' },
                  config.icon && createElement('span', { className: `text-3xl ${getIconColor(config.icon)}` }, getIconSymbol(config.icon)),
                  config.title
                ),
                createElement(AlertDialogDescription, { className: (config.text || config.html) ? 'text-gray-300' : 'sr-only' },
                  config.html ? createElement('div', { dangerouslySetInnerHTML: { __html: config.html } }) :
                  config.text || 'Dialog description'
                ),
                config.input && createElement('div', { className: 'mt-4' },
                  config.inputLabel && createElement('label', { className: 'block text-sm font-medium text-gray-300 mb-2' }, config.inputLabel),
                  createElement('input', {
                    type: config.input,
                    value: inputValue,
                    placeholder: config.inputPlaceholder,
                    onChange: (e: any) => {
                      inputValue = e.target.value;
                      validationError = '';
                      render();
                    },
                    className: 'flex h-9 w-full rounded-md border border-stone-700 bg-stone-900 px-3 py-1 text-sm text-white shadow-sm transition-colors placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
                    autoFocus: true,
                    ...(config.inputAttributes || {})
                  }),
                  validationError && createElement('p', { className: 'text-red-500 text-sm mt-2' }, validationError)
                )
              ),
              showLoading ? createElement('div', { className: 'flex justify-center py-4' },
                createElement(Spinner, { className: 'h-8 w-8' })
              ) : createElement(AlertDialogFooter, null,
                config.showCancelButton && createElement(AlertDialogCancel, {
                  onClick: handleCancel,
                  className: 'bg-stone-700 hover:bg-stone-600 text-white border-stone-600'
                }, config.cancelButtonText || 'Cancel'),
                config.showConfirmButton !== false && createElement(AlertDialogAction, {
                  onClick: handleConfirm,
                  className: `${
                    config.icon === 'error' ? 'bg-red-600 hover:bg-red-700' :
                    config.icon === 'success' ? 'bg-green-600 hover:bg-green-700' :
                    config.icon === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' :
                    'bg-blue-600 hover:bg-blue-700'
                  } text-black`
                }, config.confirmButtonText || 'OK')
              )
            )
          )
        );
      };

      render();
    });
  },

  showLoading: () => {
    return alert.fire({
      title: 'Loading...',
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false
    });
  },

  close: () => {
    // This is a no-op in the imperative API since cleanup happens automatically
  }
};

// Export as Swal replacement for drop-in compatibility
export const Swal = alert;
