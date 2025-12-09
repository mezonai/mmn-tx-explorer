'use client';
import { useEffect, useMemo, useState } from 'react';
import { Chip, PageHeader } from '@/components/shared';
import { Pagination } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { usePaginationQueryParam } from '@/hooks/usePaginationQueryParam';
import { useGames } from '../hooks/useGames';
import { GAME_TYPES, SORT_OPTIONS } from '../constants';
import { useGameTags } from '../hooks/useGameTag';

export const MezonGame = () => {
  const { page, limit, handleChangePage, handleChangeLimit } = usePaginationQueryParam();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortValue, setSortValue] = useState<string>('createdAt_DESC');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const [filterType, setFilterType] = useState<string>('All');

  const baseUrl = process.env.NEXT_PUBLIC_TOP_MEZON_AI;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    handleChangePage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, selectedTagIds]);

  const handleToggleTag = (tagId: string) => {
    if (tagId === 'ALL') {
      setSelectedTagIds([]);
      return;
    }

    setSelectedTagIds((prev) => {
      if (prev.includes(tagId)) {
        return prev.filter((id) => id !== tagId);
      } else {
        return [...prev, tagId];
      }
    });
  };

  const selectedSort = useMemo(
    () => SORT_OPTIONS.find((option) => option.value === sortValue) ?? SORT_OPTIONS[0],
    [sortValue]
  );

  const { data: GAME_TAGS } = useGameTags();

  const { data, isLoading, error } = useGames({
    search: debouncedSearch,
    pageSize: limit,
    pageNumber: page,
    sortField: selectedSort.sortField,
    sortOrder: selectedSort.sortOrder,
    type: filterType === 'All' ? undefined : filterType,
    tags: selectedTagIds.length === 0 ? undefined : selectedTagIds,
  });

  return (
    <section>
      <PageHeader
        header="Mezon Games"
        description="Explore blockchain-powered games on Mezon Mainnet. Data powered by top.mezon.ai"
      />

      <div className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="min-w-[160px] cursor-pointer rounded-[20px] border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-[var(--card-foreground)] outline-none focus:ring-2 focus:ring-[var(--ring)]">
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent>
                {GAME_TYPES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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
          </div>
        </div>

        <div className="scrollbar-hide flex w-full gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => handleToggleTag('ALL')}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-all ${
              selectedTagIds.length === 0
                ? 'bg-brand-primary border-[var(--ring)] text-white shadow-md'
                : 'border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--ring)] hover:text-[var(--foreground)]'
            }`}
          >
            All
          </button>

          {GAME_TAGS?.data.map((tag) => {
            const isActive = selectedTagIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                onClick={() => handleToggleTag(tag.id)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-brand-primary border-[var(--ring)] text-white shadow-md'
                    : 'border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--ring)] hover:text-[var(--foreground)]'
                } `}
              >
                {tag.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 mb-4 flex justify-end">
        {isLoading ? (
          <Skeleton className="h-9 w-60 rounded-md" />
        ) : (
          <Pagination
            page={data?.pageNumber ?? page}
            limit={data?.pageSize ?? limit}
            totalPages={data?.totalPages ?? 0}
            totalItems={data?.totalCount ?? 0}
            isLoading={isLoading}
            onChangePage={handleChangePage}
            onChangeLimit={handleChangeLimit}
          />
        )}
      </div>

      {error && <div className="text-center text-[var(--destructive)]">Failed to load games.</div>}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="flex gap-4 rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-lg"
              >
                <Skeleton className="h-24 w-24 shrink-0 rounded-[20px]" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Skeleton className="h-7 w-32" />
                    <Skeleton className="h-9 w-24 rounded-xl" />
                  </div>
                  <Skeleton className="mt-2 h-4 w-full" />
                  <Skeleton className="mt-2 h-4 w-3/4" />
                </div>
              </div>
            ))
          : data?.data?.map((game) => (
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
                    <div className="flex min-w-0 flex-col gap-2">
                      <h2 className="truncate text-xl font-semibold text-[var(--card-foreground)]">{game.name}</h2>
                      <div className="flex flex-wrap gap-2">
                        <Chip variant="info">{game.type.toUpperCase()}</Chip>

                        <Chip variant="success">{game.pricingTag}</Chip>
                        {game.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="rounded-md border bg-[var(--secondary)/50] px-2 py-0.5 text-xs font-medium text-[var(--muted-foreground)]"
                          >
                            #{tag.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <a
                      className="bg-brand-primary rounded-xl px-4 py-2 text-sm whitespace-nowrap text-white transition-colors hover:brightness-95"
                      href={`https://top.mezon.ai/bot/${game.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Play Now
                    </a>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-[var(--muted-foreground)]">{game.headline}</p>
                </div>
              </div>
            ))}
      </div>
    </section>
  );
};
