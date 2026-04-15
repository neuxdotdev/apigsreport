import fs from 'fs'
import path from 'path'

const sidebarPath = path.resolve('docs/api/typedoc-sidebar.json')
let sidebar = JSON.parse(fs.readFileSync(sidebarPath, 'utf8'))

function fixLinks(obj) {
	if (typeof obj === 'string') {
		let fixed = obj.replace(/\.md$/, '') // hapus .md
		if (fixed.startsWith('/docs/')) {
			// hapus /docs di awal
			fixed = fixed.slice(5)
		}
		return fixed
	}
	if (Array.isArray(obj)) {
		return obj.map(fixLinks)
	}
	if (obj && typeof obj === 'object') {
		const newObj = {}
		for (const [key, value] of Object.entries(obj)) {
			if (key === 'link' && typeof value === 'string') {
				let fixed = value.replace(/\.md$/, '')
				if (fixed.startsWith('/docs/')) fixed = fixed.slice(5)
				newObj[key] = fixed
			} else {
				newObj[key] = fixLinks(value)
			}
		}
		return newObj
	}
	return obj
}

const fixed = fixLinks(sidebar)
fs.writeFileSync(sidebarPath, JSON.stringify(fixed, null, 2))
console.log('✓ Sidebar links fixed (removed .md and /docs prefix)')
