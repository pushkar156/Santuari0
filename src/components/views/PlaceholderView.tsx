import React from 'react';

const PlaceholderView: React.FC<{ title: string; icon: React.ReactNode }> = ({ title, icon }) => (
  <div className="flex flex-col items-center justify-center w-full h-full min-h-screen text-white/40">
    <div className="p-6 bg-white/5 rounded-3xl backdrop-blur-md border border-white/10 flex flex-col items-center gap-4">
      <div className="p-4 bg-white/10 rounded-full text-white/60">
        {icon}
      </div>
      <h2 className="text-2xl font-bold text-white/80">{title}</h2>
      <p className="text-sm text-center max-w-xs">
        This view is coming soon in Santuario V2.
      </p>
    </div>
  </div>
);

export default PlaceholderView;
