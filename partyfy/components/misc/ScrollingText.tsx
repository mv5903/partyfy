import React, { useState, useRef, useEffect, memo } from 'react';
import { randomBytes } from 'crypto';

// memo is used to prevent re-rendering of the component if the props are the same (song title doesn't change.), otherwise, the animation will keep restarting.
const ScrollingText = memo(({ text } : {text: string }) => {
  const textRef = useRef(null);
  const containerRef = useRef(null);
  const [scrollDistance, setScrollDistance] = useState(0);
  const [uniqueId] = useState(() => randomBytes(16).toString('hex'));
  const fixedDelay = 2; // delay before and after scrolling
  const scrollSpeed = 30; // scrolling speed in pixels per second
  const minDuration = 5; // minimum total duration in seconds

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
  const scrollDuration = scrollDistance / scrollSpeed;
  const calculatedDuration = scrollDuration + 2 * fixedDelay; // total duration including fixed delays
  const totalDuration = Math.max(calculatedDuration, minDuration); // enforce the minimum duration
  const delayPercentage = (fixedDelay / totalDuration) * 100;

  return (
    <div ref={containerRef} style={{ overflow: 'hidden', width: '100%', position: 'relative'}}>
      {shouldScroll && (
        <style>{`
        @keyframes dynamicMarquee${uniqueId} {
          0%, ${delayPercentage}% { transform: translateX(0); }
          ${100 - delayPercentage}%, 100% { transform: translateX(-${scrollDistance}px); }
        }
        .animate-marquee${uniqueId} {
          animation: dynamicMarquee${uniqueId} ${totalDuration}s linear infinite;
        }
        `}</style>
      )}
      <div ref={textRef} className={`whitespace-nowrap ${shouldScroll ? `animate-marquee${uniqueId}` : ''}`}>
        {text}
      </div>
    </div>
  );
});

export default ScrollingText;

