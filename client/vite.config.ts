import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],
	build: {
		outDir: 'dist',
		assetsDir: 'assets',
		sourcemap: false, // 生产环境不需要 sourcemap
		rollupOptions: {
			output: {
				manualChunks: {
					vendor: ['react', 'react-dom'],
				},
			},
		},
	},
	server: {
		host: '0.0.0.0',
		port: 5173,
		proxy: {
			'/api': 'http://localhost:5050',
		},
		allowedHosts: ['localhost', '127.0.0.1', 'survey.jiangren.com.au', '*.jiangren.com.au'],
	},
});
