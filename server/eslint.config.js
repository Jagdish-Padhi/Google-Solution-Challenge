import js from '@eslint/js';
import globals from 'globals';
import { defineConfig } from 'eslint/config';

export default defineConfig([
	{
		files: ['**/*.js'],
		ignores: ['node_modules/**', 'uploads/**'],
		extends: [js.configs.recommended],
		languageOptions: {
			ecmaVersion: 2021,
			sourceType: 'module',
			globals: globals.node,
		},
		rules: {
			'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^[A-Z_]' }],
			'no-console': 'off',
		},
	},
]);
