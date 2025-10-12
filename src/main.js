import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

import './pojoviz/index.js'
import './pojoviz/renderer/index.js'

const app = mount(App, {
  target: document.getElementById('app')
})

export default app
