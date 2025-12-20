import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import path from 'path'
import os from 'os'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')

// 获取本机局域网 IP
function getLocalIP() {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // 跳过内部和非 IPv4 地址
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address
      }
    }
  }
  return 'localhost'
}

const localIP = getLocalIP()

console.log(`
╔══════════════════════════════════════════════════════════════╗
║                  📷 摄影站 - 开发环境                         ║
╠══════════════════════════════════════════════════════════════╣
║  🌐 本地访问:     http://localhost:3000                      ║
║  📱 局域网访问:   http://${localIP}:3000                ║
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
