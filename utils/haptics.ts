export const vibrate = (pattern: number | number[]) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

export const HapticPatterns = {
  TAP: 50,
  SUCCESS: [50, 50, 50],
  ERROR: [200, 100, 200, 100, 200],
  READY: 100,
};