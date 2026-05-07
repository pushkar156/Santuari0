/**
 * Hook to determine the appropriate greeting based on the current time.
 */
export const useGreeting = (date: Date): string => {
  const hours = date.getHours();

  if (hours >= 5 && hours < 12) {
    return 'Good morning';
  } else if (hours >= 12 && hours < 17) {
    return 'Good afternoon';
  } else if (hours >= 17 && hours < 22) {
    return 'Good evening';
  } else {
    return 'Good night';
  }
};
