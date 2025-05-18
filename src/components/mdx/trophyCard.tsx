import React from 'react';

export function TrophyCard({
  icon,
  title,
  children,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="
        border-2 rounded-xl px-4 py-1
        border-lime-300
        bg-[#F8FAFC] text-[#334155]
        dark:bg-[#18181b] dark:text-[#F1F5F9]
      "
    >
      <div className="flex items-center font-bold text-sm">
        <span className="mr-2">{icon}</span>
        <span>{title}</span>
      </div>
      <div className="text-sm -mt-2">
        {children}
      </div>
    </div>
  );
}