import { ReactNode } from 'react';

interface LogAttributeProps {
  label: string;
  render: ReactNode;
}

export function LogAttribute({ label, render }: LogAttributeProps) {
  return (
    <div className="items-start space-y-2 md:grid md:grid-cols-[200px_calc(100%-200px)] md:space-y-0">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{label}</span>
      </div>
      <div className="text-foreground text-sm font-normal">{render}</div>
    </div>
  );
}
