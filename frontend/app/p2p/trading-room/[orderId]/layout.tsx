export default function TradingRoomLayout({ children }: { children: React.ReactNode }) {
  // Trading room doesn't need MainLayout as it has its own full-screen layout
  return <>{children}</>;
}
