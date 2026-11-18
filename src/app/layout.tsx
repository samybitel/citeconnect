import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import { ToastProvider } from '@/components/ui/Toast';

// Police Inter auto-hébergée (subset latin, variable 100–900) :
// aucune requête vers Google Fonts, build possible hors ligne, respect RGPD.
const inter = localFont({
  src: '../fonts/inter-latin-variable.woff2',
  variable: '--font-inter',
  display: 'swap',
  weight: '100 900',
  style: 'normal',
});

export const metadata: Metadata = {
  title: {
    default: 'CiteConnect — Les services de la ville à portée de main',
    template: '%s · CiteConnect',
  },
  description:
    'CiteConnect centralise les services municipaux : compte personnel, démarches administratives et transports, depuis une seule interface.',
  applicationName: 'CiteConnect',
  icons: { icon: '/favicon.svg' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f6fb' },
    { media: '(prefers-color-scheme: dark)', color: '#090e1a' },
  ],
};

const themeInit = `(function(){try{var t=localStorage.getItem('cc-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark'){document.documentElement.classList.add('dark');}document.documentElement.style.colorScheme=t;}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}