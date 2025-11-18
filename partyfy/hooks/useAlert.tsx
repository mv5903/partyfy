import { useState, useCallback } from 'react';
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

export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'question';

interface AlertConfig {
  title: string;
  text?: string;
  html?: string;
  icon?: AlertType;
  showCancelButton?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?: string;
  cancelButtonColor?: string;
  input?: 'text' | 'datetime-local';
  inputValue?: string;
  inputLabel?: string;
  inputPlaceholder?: string;
  inputAttributes?: Record<string, any>;
  inputValidator?: (value: string) => Promise<string | null> | string | null;
  preConfirm?: (value?: string) => Promise<any> | any;
  allowOutsideClick?: boolean;
  allowEscapeKey?: boolean;
  allowEnterKey?: boolean;
  showConfirmButton?: boolean;
  willOpen?: () => void;
}

interface AlertResult {
  isConfirmed: boolean;
  isDismissed: boolean;
  isDenied: boolean;
  value?: any;
}

export const useAlert = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<AlertConfig | null>(null);
  const [resolvePromise, setResolvePromise] = useState<((value: AlertResult) => void) | null>(null);
  const [inputValue, setInputValue] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');

  const fire = useCallback((alertConfig: AlertConfig): Promise<AlertResult> => {
    return new Promise((resolve) => {
      setConfig(alertConfig);
      setInputValue(alertConfig.inputValue || '');
      setValidationError('');
      setIsOpen(true);
      setResolvePromise(() => resolve);
      if (alertConfig.willOpen) {
        alertConfig.willOpen();
      }
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    if (config?.input && config.inputValidator) {
      const error = await config.inputValidator(inputValue);
      if (error) {
        setValidationError(error);
        return;
      }
    }

    let result: any = inputValue;
    if (config?.preConfirm) {
      result = await config.preConfirm(inputValue);
    }

    setIsOpen(false);
    if (resolvePromise) {
      resolvePromise({ isConfirmed: true, isDismissed: false, isDenied: false, value: result });
    }
  }, [resolvePromise, config, inputValue]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    if (resolvePromise) {
      resolvePromise({ isConfirmed: false, isDismissed: true, isDenied: false });
    }
  }, [resolvePromise]);

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
        return '';
      case 'question':
        return '?';
      default:
        return null;
    }
  };

  const AlertComponent = () => {
    if (!config) return null;

    const showLoading = config.showConfirmButton === false;

    return (
      <AlertDialog open={isOpen} onOpenChange={(open) => {
        if (!open && (config.allowOutsideClick !== false)) {
          handleCancel();
        }
      }}>
        <AlertDialogContent className="bg-stone-800 border-stone-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center justify-center gap-3 text-xl">
              {config.icon && (
                <span className={`text-3xl ${getIconColor(config.icon)}`}>
                  {getIconSymbol(config.icon)}
                </span>
              )}
              {config.title}
            </AlertDialogTitle>
            {(config.text || config.html) && (
              <AlertDialogDescription className="text-gray-300">
                {config.html ? <div dangerouslySetInnerHTML={{ __html: config.html }} /> : config.text}
              </AlertDialogDescription>
            )}
            {config.input && (
              <div className="mt-4">
                {config.inputLabel && (
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {config.inputLabel}
                  </label>
                )}
                <input
                  type={config.input}
                  value={inputValue}
                  placeholder={config.inputPlaceholder}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setValidationError('');
                  }}
                  className="flex h-9 w-full rounded-md border border-stone-700 bg-stone-900 px-3 py-1 text-sm text-white shadow-sm transition-colors placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  autoFocus
                  {...(config.inputAttributes || {})}
                />
                {validationError && (
                  <p className="text-red-500 text-sm mt-2">{validationError}</p>
                )}
              </div>
            )}
          </AlertDialogHeader>
          {showLoading ? (
            <div className="flex justify-center py-4">
              <Spinner className="h-8 w-8" />
            </div>
          ) : (
            <AlertDialogFooter>
              {config.showCancelButton && (
                <AlertDialogCancel
                  onClick={handleCancel}
                  className="bg-stone-700 hover:bg-stone-600  border-stone-600"
                >
                  {config.cancelButtonText || 'Cancel'}
                </AlertDialogCancel>
              )}
              {config.showConfirmButton !== false && (
                <AlertDialogAction
                  onClick={handleConfirm}
                  className={`${
                    config.icon === 'error' ? 'bg-red-600 hover:bg-red-700' :
                    config.icon === 'success' ? 'bg-green-600 hover:bg-green-700' :
                    config.icon === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' :
                    'bg-blue-600 hover:bg-blue-700'
                  } text-black`}
                >
                  {config.confirmButtonText || 'OK'}
                </AlertDialogAction>
              )}
            </AlertDialogFooter>
          )}
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  return {
    fire,
    AlertComponent,
    showLoading: () => {
      setConfig({
        title: 'Loading...',
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false,
      });
      setIsOpen(true);
    },
    close: () => setIsOpen(false),
  };
};
