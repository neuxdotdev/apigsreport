import typedocSidebar from '../api/typedoc-sidebar.json'
export default {
	title: 'ApIgsReport Library',
	description: 'Pure JavaScript library to automate SSRS reports with NTLM authentication',
	lang: 'en-US',
	ignoreDeadLinks: true,
	cleanUrls: true,
	head: [
		['link', { rel: 'icon', href: '/favicon.ico', type: 'image/x-icon' }],
		['link', { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
		['link', { rel: 'apple-touch-icon', href: '/apple-touch-icon.png', sizes: '180x180' }],
		['link', { rel: 'manifest', href: '/site.webmanifest' }],
		['meta', { name: 'theme-color', content: '#3eaf7c' }],
		['meta', { name: 'og:type', content: 'website' }],
		['meta', { name: 'og:title', content: 'ApIgsReport Library' }],
		[
			'meta',
			{
				name: 'og:description',
				content: 'Pure TypeScript library for SSRS API automation with NTLM authentication',
			},
		],
		['meta', { name: 'og:image', content: '/og-image.png' }],
		['meta', { name: 'twitter:card', content: 'summary_large_image' }],
	],
	markdown: {
		lineNumbers: true,
	},
	vite: {
		server: {
			fs: {
				allow: ['..'],
			},
		},
	},
	themeConfig: {
		logo: '/logo.svg',
		nav: [
			{ text: 'Home', link: '/api/' },
			{ text: 'API Reference', link: '/api/globals' },
			{ text: 'GitHub', link: 'https://github.com/neuxdotdev/apigsreport' },
			{ text: 'npm', link: 'https://www.npmjs.com/package/apigsreport' },
		],
		sidebar: {
			'/api/': [
				{
					text: 'API Reference',
					items: typedocSidebar,
				},
			],
			'/api/': [
				{
					text: 'Guide',
					items: [
						{ text: 'Home', link: '/' },
						{ text: 'License', link: '/license' },
					],
				},
			],
		},
		footer: {
			message: 'Released under MIT License',
			copyright: 'Copyright © 2026 neuxdotdev',
		},
		socialLinks: [
			{ icon: 'github', link: 'https://github.com/neuxdotdev/apigsreport' },
			{ icon: 'npm', link: 'https://www.npmjs.com/package/apigsreport' },
		],
		editLink: {
			pattern: 'https://github.com/neuxdotdev/apigsreport/edit/master/docs/:path',
			text: 'Edit this page on GitHub',
		},
		lastUpdated: {
			text: 'Last updated',
			formatOptions: {
				dateStyle: 'full',
				timeStyle: 'medium',
			},
		},
		search: {
			provider: 'local',
			options: {
				translations: {
					button: {
						buttonText: 'Search',
						buttonAriaLabel: 'Search docs',
					},
					modal: {
						noResultsText: 'No results found',
						resetButtonTitle: 'Reset search',
						footer: {
							selectText: 'to select',
							navigateText: 'to navigate',
						},
					},
				},
			},
		},
		outline: {
			level: 'deep',
			label: 'On this page',
		},
		docFooter: {
			prev: 'Previous page',
			next: 'Next page',
		},
	},
}
