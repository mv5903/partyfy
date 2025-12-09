import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonWrapperProps {
  isLoading: boolean;
  children: React.ReactElement;
  className?: string;
  skeletonClassName?: string;
}

/**
 * SkeletonWrapper component
 * Automatically shows a skeleton with the same dimensions as its child when loading
 *
 * @example
 * <SkeletonWrapper isLoading={isLoading}>
 *   <div className="h-10 w-64">Actual Content</div>
 * </SkeletonWrapper>
 *
 * @example With custom skeleton styling
 * <SkeletonWrapper isLoading={isLoading} skeletonClassName="h-10 w-64">
 *   <Button>Click Me</Button>
 * </SkeletonWrapper>
 */
export function SkeletonWrapper({ isLoading, children, className, skeletonClassName }: SkeletonWrapperProps) {
  if (!isLoading) {
    return children;
  }

  // Extract className from child if it exists
  const childClassName = children.props.className || '';

  // Create skeleton with same className plus skeleton styles
  return (
    <div
      className={cn(
        skeletonClassName || childClassName,
        'bg-stone-900 animate-shimmer',
        className
      )}
      style={children.props.style}
    />
  );
}
