const computeDateRange = (period: string) => {
  const end = new Date();
  const start = new Date();

  if (period === 'Last 3 months') {
    start.setMonth(start.getMonth() - 3);
  } else if (period === 'Last 6 months') {
    start.setMonth(start.getMonth() - 6);
  } else if (period === 'Last 12 months') {
    start.setMonth(start.getMonth() - 12);
  } else {
    start.setMonth(start.getMonth() - 12);
  }

  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return { start_time: fmt(start), end_time: fmt(end) };
};

export { computeDateRange };
