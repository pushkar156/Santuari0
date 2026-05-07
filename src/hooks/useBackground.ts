import { useState, useEffect } from 'react';
import { useWidgetStore } from '../store/widgetStore';
import defaultBg from '../assets/default.jpg';

export const useBackground = () => {
  const customBackground = useWidgetStore((state) => state.customBackground);
  const [backgroundUrl, setBackgroundUrl] = useState<string>(defaultBg);

  useEffect(() => {
    if (customBackground) {
      setBackgroundUrl(customBackground);
    } else {
      setBackgroundUrl(defaultBg);
    }
  }, [customBackground]);

  return backgroundUrl;
};
