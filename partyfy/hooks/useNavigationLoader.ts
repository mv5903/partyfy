import NProgress from 'nprogress';

/**
 * Hook for manually controlling the navigation loader
 * Useful when you need to show loading for async operations
 *
 * @example
 * const { startLoading, stopLoading } = useNavigationLoader();
 *
 * const handleClick = async () => {
 *   startLoading();
 *   await someAsyncOperation();
 *   stopLoading();
 * };
 */
export function useNavigationLoader() {
  const startLoading = () => {
    NProgress.start();
  };

  const stopLoading = () => {
    NProgress.done();
  };

  const incrementLoading = () => {
    NProgress.inc();
  };

  return {
    startLoading,
    stopLoading,
    incrementLoading,
  };
}
