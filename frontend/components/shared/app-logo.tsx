import Image from 'next/image';

export const AppLogo = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="flex aspect-square size-9 items-center justify-center overflow-hidden rounded-lg">
        <Image src="/images/logo.webp" alt="MMN Explorer Logo" width={36} height={36} />
      </div>
      <div className="flex-1">
        <span className="text-brand-primary-900 truncate text-xl font-bold">MMN Explorer</span>
      </div>
    </div>
  );
};
