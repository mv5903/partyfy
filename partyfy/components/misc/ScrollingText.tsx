import { randomBytes } from 'crypto';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useScrollingSync } from '@/contexts/ScrollingSyncContext';

// memo is used to prevent re-rendering of the component if the props are the same (song title doesn't change.), otherwise, the animation will keep restarting.
const ScrollingText = memo(({ text, className } : {text: string, className?: string }) => {
  const textRef = useRef(null);
  const containerRef = useRef(null);
  const [scrollDistance, setScrollDistance] = useState(0);
  const [uniqueId] = useState(() => randomBytes(16).toString('hex'));
  const { cycleId, maxDuration, registerDuration, unregisterDuration } = useScrollingSync();
  const fixedDelay = 2; // delay before and after scrolling
  const scrollSpeed = 30; // pixels per second
  const maxAllowedDuration = 20; // maximum duration to prevent text from scrolling too slowly

  const myRequiredDuration = useMemo(() => {
    if (scrollDistance === 0) return 7; // minimum duration when no scrolling needed
    const scrollTime = scrollDistance / scrollSpeed;
    const calculatedDuration = scrollTime + 2 * fixedDelay;
    // Cap at maxAllowedDuration - very long text will scroll faster
    return Math.min(calculatedDuration, maxAllowedDuration);
  }, [scrollDistance]);

  useEffect(() => {
    registerDuration(uniqueId, myRequiredDuration);
    return () => unregisterDuration(uniqueId);
  }, [myRequiredDuration, uniqueId, registerDuration, unregisterDuration]);

  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current && containerRef.current) {
        const textWidth = textRef.current.scrollWidth;
        const containerWidth = containerRef.current.offsetWidth;
        const isOverflowing = textWidth > containerWidth;
        setScrollDistance(isOverflowing ? textWidth - containerWidth : 0);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);

    return () => window.removeEventListener('resize', checkOverflow);
  }, [text]);

  let shouldScroll = scrollDistance > 0;
  const delayPercentage = (fixedDelay / maxDuration) * 100;

  return (
    <div ref={containerRef} className={`overflow-hidden relative ${className}`}>
      {shouldScroll && (
        <style>{`
        @keyframes dynamicMarquee${uniqueId}-${cycleId} {
          0%, ${delayPercentage}% { transform: translateX(0); }
          ${100 - delayPercentage}%, 100% { transform: translateX(-${scrollDistance}px); }
        }
        .animate-marquee${uniqueId}-${cycleId} {
          animation: dynamicMarquee${uniqueId}-${cycleId} ${maxDuration}s linear infinite;
        }
        `}</style>
      )}
      <div ref={textRef} className={`whitespace-nowrap ${shouldScroll ? `animate-marquee${uniqueId}-${cycleId}` : ''}`}>
        {text}
      </div>
    </div>
  );
});

export default ScrollingText;

