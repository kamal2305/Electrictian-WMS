import React, { Suspense, lazy } from 'react';
import { Route, createRoutesFromElements, createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './staticStyles.css';
import './App.css';

// Context
import { AuthProvider } from './context/AuthContext';

// Eagerly loaded components (critical path)
import Navbar from './components/layout/Navbar';
import Home from './components/layout/Home';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import PrivateRoute from './components/routing/PrivateRoute';
import RoleRoute from './components/routing/RoleRoute';
import Dashboard from './components/dashboard/Dashboard';

// Lazy loaded components (code splitting for performance)
const Jobs = lazy(() => import('./components/jobs/Jobs'));
const JobForm = lazy(() => import('./components/jobs/JobForm'));
const JobDetails = lazy(() => import('./components/jobs/JobDetails'));
const JobsByElectrician = lazy(() => import('./components/jobs/JobsByElectrician'));
const ElectricianList = lazy(() => import('./components/electricians/ElectricianList'));
const ElectricianForm = lazy(() => import('./components/electricians/ElectricianForm'));
const AttendanceReport = lazy(() => import('./components/timelogs/AttendanceReport'));
const InvoiceList = lazy(() => import('./components/invoices/InvoiceList'));
const InvoiceForm = lazy(() => import('./components/invoices/InvoiceForm'));
const InvoiceView = lazy(() => import('./components/invoices/InvoiceView'));
const Analytics = lazy(() => import('./components/Analytics/Analytics'));
const Profile = lazy(() => import('./components/profile/Profile'));
const MaterialsList = lazy(() => import('./components/materials/MaterialsList'));
const MaterialForm = lazy(() => import('./components/materials/MaterialForm'));
const MaterialDetails = lazy(() => import('./components/materials/MaterialDetails'));
const MaterialInventory = lazy(() => import('./components/materials/MaterialInventory'));
const ElectricianInventory = lazy(() => import('./components/materials/ElectricianInventory'));

// App Layout component
const AppLayout = () => (
  <div className="App">
    <Navbar />
    <main className="container">
      <ErrorBoundary>
        <Suspense fallback={<div className="loading">Loading...</div>}>
          <Outlet />
        </Suspense>
      </ErrorBoundary>
    </main>
    <ToastContainer position="top-right" autoClose={5000} />
  </div>
);

// Route configurations
const routes = {
  public: [
    { path: '/', element: <Home /> },
    { path: 'login', element: <Login /> },
    { path: 'register', element: <Register /> }
  ],
  private: [
    { path: 'dashboard', element: <Dashboard /> },
    { path: 'profile', element: <Profile /> },
    { path: 'jobs', element: <Jobs /> },
    { path: 'jobs/:id', element: <JobDetails /> }
  ],
  admin: [
    { path: 'jobs/create', element: <JobForm /> },
    { path: 'jobs/:id/edit', element: <JobForm /> },
    { path: 'jobs/electrician/:id', element: <JobsByElectrician /> },
    { path: 'electricians', element: <ElectricianList /> },
    { path: 'electricians/create', element: <ElectricianForm /> },
    { path: 'electricians/:id/edit', element: <ElectricianForm /> },
    { path: 'reports/attendance', element: <AttendanceReport /> },
    { path: 'invoices', element: <InvoiceList /> },
    { path: 'invoices/create', element: <InvoiceForm /> },
    { path: 'invoices/:id', element: <InvoiceView /> },
    { path: 'invoices/:id/edit', element: <InvoiceForm /> },
    { path: 'analytics', element: <Analytics /> },
    { path: 'materials/create', element: <MaterialForm /> },
    { path: 'materials/:id/edit', element: <MaterialForm /> },
    { path: 'admin', element: <h1>Admin Dashboard - Coming Soon</h1> },
    { path: 'materials/inventory', element: <MaterialInventory /> }
  ],
  shared: [
    { path: 'materials', element: <MaterialsList /> },
    { path: 'materials/:id', element: <MaterialDetails /> }
  ],
  electrician: [
    { path: 'materials/inventory', element: <ElectricianInventory /> }
  ]
};

// Create router
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<AppLayout />}>
      {routes.public.map(route => (
        <Route key={route.path} {...route} />
      ))}
      
      <Route element={<PrivateRoute />}>
        {routes.private.map(route => (
          <Route key={route.path} {...route} />
        ))}
        
        <Route element={<RoleRoute allowedRoles={['admin']} />}>
          {routes.admin.map(route => (
            <Route key={route.path} {...route} />
          ))}
        </Route>
        
        <Route element={<RoleRoute allowedRoles={['admin', 'electrician']} />}>
          {routes.shared.map(route => (
            <Route key={route.path} {...route} />
          ))}
        </Route>
        
        <Route element={<RoleRoute allowedRoles={['electrician']} />}>
          {routes.electrician.map(route => (
            <Route key={route.path} {...route} />
          ))}
        </Route>
      </Route>
      
      <Route path="unauthorized" element={<h1>Unauthorized Access</h1>} />
      <Route path="*" element={<h1>Page Not Found</h1>} />
    </Route>
  ),
  {
    future: {
      v7_relativeSplatPath: true,
      v7_startTransition: true
    },
    basename: '/'
  }
);

// Error boundary component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("UI Rendering Error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h2>Something went wrong</h2>
          <p>We're sorry, but there was an error loading this page.</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Main App component
const App = () => (
  <AuthProvider>
    <RouterProvider router={router} />
  </AuthProvider>
);

export default App;
