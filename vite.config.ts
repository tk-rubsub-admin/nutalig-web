import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import svgrPlugin from 'vite-plugin-svgr';

const Config = () => {
  return defineConfig({
    envPrefix: 'REACT_APP_',
    build: {
      outDir: 'build'
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8002/nutalig',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    },
    plugins: [react(), viteTsconfigPaths(), svgrPlugin()]
  });
};

export default Config;
