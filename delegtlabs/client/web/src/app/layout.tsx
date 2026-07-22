import "./globals.css";

export const metadata = {
  title: "DelegtLabs",
  description: "Pricing and checkout for DelegtLabs agents",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
