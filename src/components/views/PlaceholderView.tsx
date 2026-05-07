import React from 'react';

const PlaceholderView: React.FC<{ title: string; icon: React.ReactNode }> = ({ title, icon }) => (
  <div className="flex flex-col items-center justify-center w-full h-full min-h-screen text-theme-muted">
    <div className="p-12 bg-theme-glass rounded-3xl backdrop-blur-md border border-theme-border flex flex-col items-center gap-6 shadow-2xl">
      <div className="p-6 bg-theme-hover rounded-full text-theme-text shadow-inner">
        {icon}
      </div>
      <h2 className="text-3xl font-bold text-theme-text">{title}</h2>
      <p className="text-sm text-center max-w-xs opacity-70">
        This view is coming soon in Santuario V2.
      </p>
    </div>
  </div>
);

export default PlaceholderView;
