import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')

console.log(`
╔══════════════════════════════════════════════════════════════╗
║                  📷 摄影站 - 开发环境                         ║
╠══════════════════════════════════════════════════════════════╣
║  🌐 主站页面:     http://localhost:3000                      ║
║  🔧 管理后台:     http://localhost:3000/admin                ║
║  📡 API 服务:     http://localhost:3001 (内部代理)           ║
╠══════════════════════════════════════════════════════════════╣
║  📁 数据文件:     src/data/photos.js                         ║
║  📷 上传目录:     uploads/                                   ║
╚══════════════════════════════════════════════════════════════╝
`)

console.log('⏳ 正在启动服务...\n')

// 启动后端 API 服务
const backend = spawn('node', ['admin-server/index.js'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true
})

// 等待后端启动后再启动前端
setTimeout(() => {
  const frontend = spawn('npx', ['vite'], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true
  })

  frontend.on('error', (err) => {
    console.error('❌ 前端启动失败:', err)
    process.exit(1)
  })
}, 1000)

backend.on('error', (err) => {
  console.error('❌ 后端启动失败:', err)
  process.exit(1)
})

// 处理退出
process.on('SIGINT', () => {
  console.log('\n👋 正在关闭服务...')
  backend.kill()
  process.exit()
})
