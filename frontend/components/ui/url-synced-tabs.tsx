'use client';

import * as React from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { useQueryParam } from '@/hooks/useQueryParam';

interface UrlSyncedTabsProps extends React.ComponentProps<typeof Tabs> {
  queryParam?: string;
  defaultValue: string;
  clearParams?: string[];
}

export const Tab = ({ queryParam = 'tab', defaultValue, clearParams, ...props }: UrlSyncedTabsProps) => {
  const { value, handleChangeValue } = useQueryParam<string>({
    queryParam,
    defaultValue,
    clearParams,
  });

  return <Tabs value={value} onValueChange={handleChangeValue as (val: string) => void} {...props} />;
};

export { TabsContent, TabsList, TabsTrigger };
type TabItem = {
  value: string;
  label: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
};

interface UrlSyncedTabsRendererProps extends Omit<UrlSyncedTabsProps, 'children'> {
  items: TabItem[];
  listClassName?: string;
}

export const UrlSyncedTabs = ({ items, listClassName, ...tabsProps }: UrlSyncedTabsRendererProps) => {
  return (
    <Tab {...tabsProps}>
      <TabsList className={listClassName}>
        {items.map((item) => (
          <TabsTrigger key={item.value} value={item.value} disabled={item.disabled}>
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {items.map((item) => (
        <TabsContent key={item.value} value={item.value}>
          {item.content}
        </TabsContent>
      ))}
    </Tab>
  );
};
