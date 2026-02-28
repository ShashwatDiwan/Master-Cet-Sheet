import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize Vercel Speed Insights (real-user monitoring)
import { injectSpeedInsights } from '@vercel/speed-insights'

createRoot(document.getElementById("root")!).render(<App />);

// Call after app mount so initial page load is captured
injectSpeedInsights();
