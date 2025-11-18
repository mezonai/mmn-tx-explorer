'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ChecklistItem {
  id: number;
  text: string;
  completed: boolean;
}

interface PrePublishChecklistProps {
  items: ChecklistItem[];
}

export const PrePublishChecklist = ({ items }: PrePublishChecklistProps) => {
  return (
    <Card className="bg-background dark:bg-primary/10 gap-4 border-gray-200 dark:border-white/10">
      <CardHeader className="">
        <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white">Pre-publish checklist</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-3">
              <span
                className={`mt-1 inline-flex h-5 w-5 min-w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                  item.completed
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300'
                    : 'bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20'
                }`}
              >
                {item.completed ? '✓' : item.id}
              </span>
              <p
                className={`text-sm ${
                  item.completed ? 'text-gray-500 line-through dark:text-gray-400' : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {item.text}
              </p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
