import localFont from 'next/font/local';

// 固定使用本地字体，不再依赖环境变量/远程 Google。
export const montserrat = localFont({
  src: [
    { path: '../../public/asserts/Montserrat-Regular.otf', weight: '400', style: 'normal' },
  ],
  display: 'swap',
  fallback: ['system-ui', 'Arial', 'sans-serif'],
});
