import React from 'react';
import { useWidgetStore } from '../../store/widgetStore';
import { sanitizeCustomCSS } from '../../lib/cssSanitizer';

export const CustomCSSInjector: React.FC = () => {
  const { customCSS } = useWidgetStore();

  // Defence-in-depth: sanitize again at render time so the injected value is
  // always safe even if state was mutated outside the sanitized setter.
  const safeCSS = sanitizeCustomCSS(customCSS);
  if (!safeCSS) return null;

  return (
    <style id="santuario-custom-css">
      {safeCSS}
    </style>
  );
};
