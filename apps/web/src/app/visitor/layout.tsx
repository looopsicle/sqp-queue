export default function VisitorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Keep the existing visitor experience unchanged; its page owns its UI.
  return <>{children}</>;
}
