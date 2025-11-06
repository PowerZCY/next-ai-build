import { Montserrat } from "next/font/google";

export const montserrat = Montserrat({
  weight: ['400'],
  subsets: ['latin'],
  display: 'swap',
  fallback: ['system-ui', 'Arial', 'sans-serif']
});