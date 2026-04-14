import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import StoryPage from './pages/StoryPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/story/:slug" element={<StoryPage />} />
    </Routes>
  )
}
