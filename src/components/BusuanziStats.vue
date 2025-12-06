<template>
  <div class="flex items-center justify-center gap-3 text-[11px] text-[var(--text-secondary)]">
    <span>今日访问 <span id="busuanzi_today_pv" class="text-[var(--text-primary)]">-</span> 次</span>
    <span class="text-[var(--border-color)]">|</span>
    <span>总访问 <span id="busuanzi_site_pv" class="text-[var(--text-primary)]">-</span> 次</span>
  </div>
</template>

<script>
import { onMounted } from 'vue'

export default {
  name: 'BusuanziStats',
  setup() {
    onMounted(() => {
      const script = document.createElement('script')
      script.defer = true
      script.src = '//cdn.busuanzi.cc/busuanzi/3.6.9/busuanzi.min.js'
      document.body.appendChild(script)
    })
  }
}
</script>
