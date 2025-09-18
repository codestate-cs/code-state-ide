const esbuild = require("esbuild");
const fs = require('fs');
const path = require('path');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
	name: 'esbuild-problem-matcher',

	setup(build) {
		build.onStart(() => {
			console.log('[watch] build started');
		});
		build.onEnd((result) => {
			result.errors.forEach(({ text, location }) => {
				console.error(`✘ [ERROR] ${text}`);
				console.error(`    ${location.file}:${location.line}:${location.column}:`);
			});
			console.log('[watch] build finished');
		});
	},
};

/**
 * Copy UI library files to resources directory
 */
function copyUIFiles() {
	const uiSourceDir = path.join(__dirname, 'node_modules', '@codestate', 'ui', 'dist');
	const uiDestDir = path.join(__dirname, 'resources', 'ui');
	
	// Create ui directory in resources
	if (!fs.existsSync(uiDestDir)) {
		fs.mkdirSync(uiDestDir, { recursive: true });
	}
	
	// Copy CSS file
	const cssSource = path.join(uiSourceDir, 'codesate-ui.css');
	const cssDest = path.join(uiDestDir, 'codesate-ui.css');
	if (fs.existsSync(cssSource)) {
		fs.copyFileSync(cssSource, cssDest);
		console.log('Copied codesate-ui.css to resources/ui/');
	}
	
	// Copy JS file
	const jsSource = path.join(uiSourceDir, 'codesate-ui.iife.js');
	const jsDest = path.join(uiDestDir, 'codesate-ui.iife.js');
	if (fs.existsSync(jsSource)) {
		fs.copyFileSync(jsSource, jsDest);
		console.log('Copied codesate-ui.iife.js to resources/ui/');
	}
}

async function main() {
	const ctx = await esbuild.context({
		entryPoints: [
			'src/extension.ts'
		],
		bundle: true,
		format: 'cjs',
		minify: production,
		sourcemap: !production,
		sourcesContent: false,
		platform: 'node',
		outfile: 'dist/extension.js',
		external: ['vscode'],
		logLevel: 'silent',
		// Tree shaking optimizations
		treeShaking: true,
		drop: production ? ['console', 'debugger'] : [],
		// Additional optimizations
		keepNames: false,
		plugins: [
			/* add to the end of plugins array */
			esbuildProblemMatcherPlugin,
		],
	});
	if (watch) {
		await ctx.watch();
	} else {
		await ctx.rebuild();
		await ctx.dispose();
	}
	
	// Copy UI files after build
	copyUIFiles();
}

main().catch(e => {
	console.error(e);
	process.exit(1);
});
