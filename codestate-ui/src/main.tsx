import { render } from 'preact'
import './index.css'
import { App } from './app.tsx'
import { MockProvider } from './providers/MockProvider'

// Set initial theme
document.documentElement.setAttribute('data-theme', 'dark');

// Create mock provider and render the app
const provider = new MockProvider();
render(<App provider={provider} />, document.getElementById('app')!)
