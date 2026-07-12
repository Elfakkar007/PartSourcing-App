import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import LinePage from './pages/LinePage'
import AdminSettings from './pages/AdminSettings'
import RecycleBin from './pages/RecycleBin'

function AdminRoute({ children }) {
  const { currentUser, userRole } = useAuth()
  if (!currentUser) return <Navigate to="/login" />
  if (userRole !== 'admin') return <Navigate to="/" />
  return children
}

function PrivateRoute({ children }) {
  const { currentUser } = useAuth()
  return currentUser ? children : <Navigate to="/login" />
}

function PublicRoute({ children }) {
  const { currentUser } = useAuth()
  return currentUser ? <Navigate to="/" /> : children
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/line/:lineId"
              element={
                <PrivateRoute>
                  <LinePage />
                </PrivateRoute>
              }
            />
            <Route 
              path="/admin/settings" 
              element={
                <AdminRoute>
                  <AdminSettings />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/recycle-bin" 
              element={
                <AdminRoute>
                  <RecycleBin />
                </AdminRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
