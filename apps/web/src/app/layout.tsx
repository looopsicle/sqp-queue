import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scientia Square Park | Virtual Queue & Visitor Portal",
  description:
    "Explore attractions, check live wait times, manage your tickets, and join the virtual queue at Scientia Square Park.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Open+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-full flex flex-col bg-[#FFF4DC] text-[#263B29]"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
