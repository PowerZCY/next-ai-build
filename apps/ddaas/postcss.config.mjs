/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {
      config: {
        content: [
          './src/**/*.{js,ts,jsx,tsx}',
          '../../packages/base-ui/src/**/*.{js,ts,jsx,tsx}',
          '../../packages/third-ui/src/**/*.{js,ts,jsx,tsx}',
        ],
      },
    },
  },
};

export default config;
