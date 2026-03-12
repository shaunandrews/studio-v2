import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')

// Agentation — dev only, tree-shaken from production build
if (import.meta.env.DEV) {
  import('react').then((React) =>
    import('react-dom/client').then(({ createRoot }) =>
      import('agentation').then(({ Agentation }) => {
        const el = document.createElement('div')
        document.body.appendChild(el)
        createRoot(el).render(React.createElement(Agentation, { endpoint: 'http://localhost:4747' }))
      })
    )
  )
}
