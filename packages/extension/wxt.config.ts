import { defineConfig } from 'wxt'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'ChromeClaw',
    description: 'Your AI Agent, Native in the Browser',
    permissions: [
      'sidePanel',
      'activeTab',
      'tabs',
      'tabGroups',
      'contextMenus',
      'storage',
      'scripting',
      'bookmarks',
      'history',
      'downloads',
      'cookies',
      'notifications',
      'offscreen',
    ],
    action: {},
    host_permissions: ['<all_urls>'],
    commands: {
      _execute_action: {
        suggested_key: {
          default: 'Ctrl+Shift+L',
          mac: 'Command+Shift+L',
        },
        description: 'Toggle ChromeClaw side panel',
      },
    },
    omnibox: {
      keyword: 'cc',
    },
  },
})
