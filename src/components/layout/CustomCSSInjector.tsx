import React from 'react';
import { useWidgetStore } from '../../store/widgetStore';

export const CustomCSSInjector: React.FC = () => {
  const { customCSS } = useWidgetStore();

  if (!customCSS) return null;

  return (
    <style id="santuario-custom-css">
      {customCSS}
    </style>
  );
};
