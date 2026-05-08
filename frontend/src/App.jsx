import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Sidebar from './components/Sidebar.jsx'
import Dashboard from './components/Dashboard.jsx'
import RequestForm from './components/RequestForm.jsx'
import WorkflowScreen from './components/WorkflowScreen.jsx'
import RequestsList from './components/RequestsList.jsx'

export default function App() {
  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <Toaster position="top-right" />
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/requests" element={<RequestsList />} />
          <Route path="/submit" element={<RequestForm />} />
          <Route path="/requests/:id" element={<WorkflowScreen />} />
        </Routes>
      </main>
    </div>
  )
}
