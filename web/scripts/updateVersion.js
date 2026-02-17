const path = require('path')
const fs = require('fs')
const pkg = require('../../simple-mind-map/package.json')

const file = path.resolve(__dirname, '../../simple-mind-map/full.ts')
let content = fs.readFileSync(file, 'utf-8')
content = content.replace(
  /(M\.version\s*=\s*)[^\n]+(\n)/,
  `$1'${pkg.version}'$2`
)
fs.writeFileSync(file, content)