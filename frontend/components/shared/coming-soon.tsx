interface ComingSoonProps {
  title: string;
  description?: string;
  className?: string;
}

export const ComingSoon = ({
  title,
  description = "We're working hard to bring you something amazing. Stay tuned!",
  className = '',
}: ComingSoonProps) => {
  return (
    <div className={`space-y-8 ${className}`}>
      <h1 className="text-2xl font-semibold">{title}</h1>

      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="text-primary z-10 mb-8 text-3xl font-bold md:text-5xl">Coming Soon</h1>
        <p className="text-quaternary-500 text-center text-lg">{description}</p>
      </div>
    </div>
  );
};
