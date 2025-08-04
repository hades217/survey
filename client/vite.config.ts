import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],
	build: {
		outDir: 'dist',
		assetsDir: 'assets',
		sourcemap: false, // No sourcemap needed in production
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
			'/api': {
				target: 'http://backend:5050',
				changeOrigin: true,
				secure: false,
			},
		},
		allowedHosts: ['localhost', '127.0.0.1', 'survey.jiangren.com.au', '*.jiangren.com.au'],
	},
});
