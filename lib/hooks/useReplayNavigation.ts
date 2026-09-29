'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  isReviewingPastMove,
  stepFirst,
  stepLast,
  stepNext,
  stepPrev,
} from '@/lib/go/replay';
import { stoneSoundEngine } from '@/lib/go/sound';

export interface UseReplayNavigationOptions {
  totalMoves: number;
  soundEnabled?: boolean;
}

export interface UseReplayNavigationReturn {
  reviewStep: number | null;
  setReviewStep: React.Dispatch<React.SetStateAction<number | null>>;
  isReviewing: boolean;
  handleStepPrev: () => void;
  handleStepNext: () => void;
  handleStepFirst: () => void;
  handleStepLast: () => void;
  handleReturnToLive: () => void;
  handleSelectStep: (step: number) => void;
}

/**
 * Custom hook dedicated to managing board replay review steps,
 * sound triggers, step clamps, and keyboard navigation.
 */
export function useReplayNavigation(
  options: UseReplayNavigationOptions
): UseReplayNavigationReturn {
  const { totalMoves, soundEnabled = true } = options;
  const [reviewStep, setReviewStep] = useState<number | null>(null);

  const isReviewing = isReviewingPastMove(reviewStep, totalMoves);

  const handleStepPrev = useCallback(() => {
    setReviewStep(curr => {
      const next = stepPrev(curr, totalMoves);
      if (soundEnabled) stoneSoundEngine.playStoneClick();
      return next;
    });
  }, [totalMoves, soundEnabled]);

  const handleStepNext = useCallback(() => {
    setReviewStep(curr => {
      const next = stepNext(curr, totalMoves);
      if (soundEnabled && next !== curr) stoneSoundEngine.playStoneClick();
      return next;
    });
  }, [totalMoves, soundEnabled]);

  const handleStepFirst = useCallback(() => {
    setReviewStep(stepFirst());
    if (soundEnabled) stoneSoundEngine.playStoneClick();
  }, [soundEnabled]);

  const handleStepLast = useCallback(() => {
    setReviewStep(stepLast());
    if (soundEnabled) stoneSoundEngine.playStoneClick();
  }, [soundEnabled]);

  const handleReturnToLive = useCallback(() => {
    setReviewStep(null);
  }, []);

  const handleSelectStep = useCallback(
    (step: number) => {
      if (step >= totalMoves) {
        setReviewStep(null);
      } else {
        setReviewStep(Math.max(0, step));
      }
      if (soundEnabled) stoneSoundEngine.playStoneClick();
    },
    [totalMoves, soundEnabled]
  );

  // Keyboard Navigation: ArrowLeft (back), ArrowRight (forward), Home (first), End (last)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable
      ) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleStepPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleStepNext();
      } else if (e.key === 'Home') {
        e.preventDefault();
        handleStepFirst();
      } else if (e.key === 'End') {
        e.preventDefault();
        handleStepLast();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleStepPrev, handleStepNext, handleStepFirst, handleStepLast]);

  return {
    reviewStep,
    setReviewStep,
    isReviewing,
    handleStepPrev,
    handleStepNext,
    handleStepFirst,
    handleStepLast,
    handleReturnToLive,
    handleSelectStep,
  };
}
