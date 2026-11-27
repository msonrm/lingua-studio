import { readdirSync, readFileSync } from 'node:fs'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Blockly のメディア（ズーム・ゴミ箱のスプライト、効果音、カーソル）を自前で配信する。
 *
 * Blockly は `media` 未指定だと https://blockly-demo.appspot.com/static/media/ を読みに行くが、
 * そこの sprites.png が 404 になり、右下のズーム・ゴミ箱ボタンが表示されなくなった。
 * インストール済みの blockly パッケージに同梱されているファイルを配信することで、
 * 外部サーバーに依存せず、Blockly のバージョンとも常に一致させる。
 */
const BLOCKLY_MEDIA_URL = 'blockly-media'
const BLOCKLY_MEDIA_DIR = fileURLToPath(new URL('./node_modules/blockly/media/', import.meta.url))

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.cur': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
}

function blocklyMedia(): Plugin {
  const files = () => readdirSync(BLOCKLY_MEDIA_DIR)
  return {
    name: 'blockly-media',
    configureServer(server) {
      const available = new Set(files())
      server.middlewares.use(`/${BLOCKLY_MEDIA_URL}`, (req, res, next) => {
        const name = decodeURIComponent((req.url ?? '').split('?')[0]).replace(/^\//, '')
        if (!available.has(name)) return next()
        res.setHeader('Content-Type', MIME_TYPES[extname(name)] ?? 'application/octet-stream')
        res.end(readFileSync(join(BLOCKLY_MEDIA_DIR, name)))
      })
    },
    generateBundle() {
      for (const name of files()) {
        this.emitFile({
          type: 'asset',
          fileName: `${BLOCKLY_MEDIA_URL}/${name}`,
          source: readFileSync(join(BLOCKLY_MEDIA_DIR, name)),
        })
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), blocklyMedia()],
})
