import { BrowserRouter } from 'react-router-dom'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ClerkProvider } from '@clerk/clerk-react'

const clerkkey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

createRoot(document.getElementById('root')).render(
  <ClerkProvider publishableKey={clerkkey}>
  <BrowserRouter>
    <App />
  </BrowserRouter>
  </ClerkProvider>
  
)
