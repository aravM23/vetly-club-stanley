import { Route, Routes } from 'react-router-dom'
import AuthPage from '@/pages/Auth'
import DashboardPage from '@/pages/Dashboard'
import { ProtectedRoute } from '@/components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

function NotFound() {
  return (
    <main className="min-h-screen grid place-items-center">
      <p className="font-display text-3xl text-paper">404</p>
    </main>
  )
}
