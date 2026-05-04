// vite.config.ts 의 resolve.alias 에 머지.
import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
	resolve: {
		alias: {
			'~language': path.resolve(__dirname, 'src/static/language'),
			'~hooks': path.resolve(__dirname, 'src/hooks')
		}
	}
});
