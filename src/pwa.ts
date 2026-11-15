import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({ onNeedRefresh() { window.dispatchEvent(new Event('routine-update-ready')) } })
export function applyUpdate() { return updateSW(true) }
