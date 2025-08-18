import { useEffect, useCallback, useRef, useState } from 'react';

const useKeyboardNavigation = ({
  onEnter,
  onEscape,
  onArrowUp,
  onArrowDown,
  onArrowLeft,
  onArrowRight,
  onTab,
  onShiftTab,
  enabled = true,
  preventDefault = true
}) => {
  const elementRef = useRef(null);

  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;

    const { key, shiftKey, ctrlKey, metaKey } = event;

    // Prevent default behavior if specified
    if (preventDefault) {
      const shouldPrevent = [
        'Enter', 'Escape', 'ArrowUp', 'ArrowDown', 
        'ArrowLeft', 'ArrowRight', 'Tab'
      ].includes(key);
      
      if (shouldPrevent) {
        event.preventDefault();
      }
    }

    switch (key) {
      case 'Enter':
        if (onEnter) onEnter(event);
        break;
      case 'Escape':
        if (onEscape) onEscape(event);
        break;
      case 'ArrowUp':
        if (onArrowUp) onArrowUp(event);
        break;
      case 'ArrowDown':
        if (onArrowDown) onArrowDown(event);
        break;
      case 'ArrowLeft':
        if (onArrowLeft) onArrowLeft(event);
        break;
      case 'ArrowRight':
        if (onArrowRight) onArrowRight(event);
        break;
      case 'Tab':
        if (shiftKey && onShiftTab) {
          onShiftTab(event);
        } else if (onTab) {
          onTab(event);
        }
        break;
      default:
        break;
    }
  }, [
    enabled,
    preventDefault,
    onEnter,
    onEscape,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    onShiftTab
  ]);

  useEffect(() => {
    const element = elementRef.current;
    if (element && enabled) {
      element.addEventListener('keydown', handleKeyDown);
      return () => element.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, enabled]);

  // Focus management
  const focusElement = useCallback(() => {
    if (elementRef.current) {
      elementRef.current.focus();
    }
  }, []);

  return {
    elementRef,
    focusElement
  };
};

// Hook for table keyboard navigation
export const useTableKeyboardNavigation = ({
  data = [],
  onRowSelect,
  onRowActivate,
  enabled = true
}) => {
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const handleArrowUp = useCallback((event) => {
    event.preventDefault();
    setSelectedIndex(prev => {
      const newIndex = Math.max(0, prev - 1);
      if (onRowSelect) onRowSelect(data[newIndex], newIndex);
      return newIndex;
    });
  }, [data, onRowSelect]);

  const handleArrowDown = useCallback((event) => {
    event.preventDefault();
    setSelectedIndex(prev => {
      const newIndex = Math.min(data.length - 1, prev + 1);
      if (onRowSelect) onRowSelect(data[newIndex], newIndex);
      return newIndex;
    });
  }, [data, onRowSelect]);

  const handleEnter = useCallback((event) => {
    event.preventDefault();
    if (selectedIndex >= 0 && selectedIndex < data.length && onRowActivate) {
      onRowActivate(data[selectedIndex], selectedIndex);
    }
  }, [data, selectedIndex, onRowActivate]);

  const { elementRef, focusElement } = useKeyboardNavigation({
    onArrowUp: handleArrowUp,
    onArrowDown: handleArrowDown,
    onEnter: handleEnter,
    enabled
  });

  // Reset selection when data changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [data]);

  return {
    elementRef,
    focusElement,
    selectedIndex,
    setSelectedIndex
  };
};

// Hook for modal keyboard navigation
export const useModalKeyboardNavigation = ({
  onClose,
  onConfirm,
  enabled = true
}) => {
  const handleEscape = useCallback((event) => {
    if (onClose) onClose(event);
  }, [onClose]);

  const handleEnter = useCallback((event) => {
    // Only trigger on Ctrl+Enter or Cmd+Enter to avoid conflicts with form inputs
    if ((event.ctrlKey || event.metaKey) && onConfirm) {
      onConfirm(event);
    }
  }, [onConfirm]);

  return useKeyboardNavigation({
    onEscape: handleEscape,
    onEnter: handleEnter,
    enabled,
    preventDefault: false // Let form inputs handle their own events
  });
};

export default useKeyboardNavigation;