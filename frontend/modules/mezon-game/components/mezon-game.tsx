'use client';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/shared';
import { Pagination } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePaginationQueryParam } from '@/hooks/usePaginationQueryParam';
import { useGames } from '../hooks/useGames';
import { SORT_OPTIONS } from '../constants';

export const MezonGame = () => {
  const { page, limit, handleChangePage, handleChangeLimit } = usePaginationQueryParam();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortValue, setSortValue] = useState<string>('createdAt_DESC');
  const baseUrl = process.env.NEXT_PUBLIC_TOP_MEZON_AI;
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(handler);
  }, [search]);

  const selectedSort = useMemo(
    () => SORT_OPTIONS.find((option) => option.value === sortValue) ?? SORT_OPTIONS[0],
    [sortValue]
  );

  const { data, isLoading, error } = useGames({
    search: debouncedSearch,
    pageSize: limit,
    pageNumber: page,
    sortField: selectedSort.sortField,
    sortOrder: selectedSort.sortOrder,
  });

  return (
    <section>
      <PageHeader
        header="Mezon Games"
        description="Explore blockchain-powered games on Mezon Mainnet. Data powered by top.mezon.ai"
      />

      <div className="mt-8 mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            placeholder="Search games..."
            className="w-full rounded-[20px] border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-[var(--card-foreground)] transition-all outline-none placeholder:text-[var(--muted-foreground)] focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex w-full flex-col items-stretch gap-3 md:w-auto md:flex-row md:items-center md:justify-end">
          <Select value={sortValue} onValueChange={setSortValue}>
            <SelectTrigger className="min-w-[220px] cursor-pointer rounded-[20px] border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-[var(--card-foreground)] outline-none focus:ring-2 focus:ring-[var(--ring)]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {data && data.totalPages > 0 && (
            <div className="flex justify-end md:justify-start">
              <Pagination
                page={data.pageNumber ?? page}
                limit={data.pageSize ?? limit}
                totalPages={data.totalPages ?? 1}
                totalItems={data.totalCount ?? 0}
                isLoading={isLoading}
                onChangePage={handleChangePage}
                onChangeLimit={handleChangeLimit}
              />
            </div>
          )}
        </div>
      </div>

      {isLoading && <div className="text-center text-[var(--muted-foreground)]">Loading games...</div>}
      {error && <div className="text-center text-[var(--destructive)]">Failed to load games.</div>}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {data?.data?.map((game) => (
          <div
            key={game.id}
            className="flex gap-4 rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-lg transition-colors hover:border-[var(--ring)]"
          >
            <img
              src={
                game.featuredImage
                  ? `${baseUrl}/api${game.featuredImage}`
                  : `https://top.mezon.ai/assets/avatar-bot-default-Cbn8rW_G.png`
              }
              alt={game.name}
              className="h-24 w-24 shrink-0 rounded-[20px] object-cover"
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h2 className="truncate text-xl font-semibold text-[var(--card-foreground)]">{game.name}</h2>
                <a
                  className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm whitespace-nowrap text-[var(--primary-foreground)] transition-colors hover:brightness-95"
                  href={`https://top.mezon.ai/bot/${game.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Play Now
                </a>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-[var(--muted-foreground)]">{game.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
