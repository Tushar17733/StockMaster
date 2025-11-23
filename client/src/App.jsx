import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { MainLayout } from './components/Layout/MainLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { PageLoader } from './components/UI/Loader';

// Component to redirect authenticated users away from auth pages
const AuthRedirect = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <PageLoader />;
  }
  
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Auth pages
import { Login } from './features/auth/Login';
import { Signup } from './features/auth/Signup';
import { RequestOTP } from './features/auth/RequestOTP';
import { ResetPassword } from './features/auth/ResetPassword';

// Feature pages
import { Dashboard } from './features/dashboard/Dashboard';
import { ProductsList } from './features/products/ProductsList';
import { ProductForm } from './features/products/ProductForm';
import { ProductDetail } from './features/products/ProductDetail';
import { CategoriesList } from './features/categories/CategoriesList';
import { CategoryForm } from './features/categories/CategoryForm';
import { WarehousesList } from './features/warehouses/WarehousesList';
import { WarehouseDetail } from './features/warehouses/WarehouseDetail';
import { WarehouseForm } from './features/warehouses/WarehouseForm';
import { LocationsList } from './features/locations/LocationsList';
import { LocationForm } from './features/locations/LocationForm';
import { DocumentsList } from './features/documents/DocumentsList';
import { DocumentForm } from './features/documents/DocumentForm';
import { DocumentDetail } from './features/documents/DocumentDetail';
import { MovesList } from './features/moves/MovesList';
import { ReorderRulesList } from './features/reorderRules/ReorderRulesList';
import { ReorderRuleForm } from './features/reorderRules/ReorderRuleForm';
import { Profile } from './features/profile/Profile';

const HomeRedirect = () => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <PageLoader />;
  }
  
  return isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth/login" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      
      {/* Auth routes - redirect to dashboard if already authenticated */}
      <Route 
        path="/auth/login" 
        element={
          <AuthRedirect>
            <Login />
          </AuthRedirect>
        } 
      />
      <Route 
        path="/auth/signup" 
        element={
          <AuthRedirect>
            <Signup />
          </AuthRedirect>
        } 
      />
      <Route path="/auth/request-otp" element={<RequestOTP />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />
      
      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ProductsList />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/products/new"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ProductForm />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/products/:id"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ProductDetail />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/products/:id/edit"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ProductForm />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/categories"
        element={
          <ProtectedRoute>
            <MainLayout>
              <CategoriesList />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/categories/new"
        element={
          <ProtectedRoute>
            <MainLayout>
              <CategoryForm />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/categories/:id/edit"
        element={
          <ProtectedRoute>
            <MainLayout>
              <CategoryForm />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/warehouses"
        element={
          <ProtectedRoute>
            <MainLayout>
              <WarehousesList />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/warehouses/new"
        element={
          <ProtectedRoute>
            <MainLayout>
              <WarehouseForm />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/warehouses/:id"
        element={
          <ProtectedRoute>
            <MainLayout>
              <WarehouseDetail />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/warehouses/:id/edit"
        element={
          <ProtectedRoute>
            <MainLayout>
              <WarehouseForm />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/locations"
        element={
          <ProtectedRoute>
            <MainLayout>
              <LocationsList />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/locations/new"
        element={
          <ProtectedRoute>
            <MainLayout>
              <LocationForm />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/locations/:id/edit"
        element={
          <ProtectedRoute>
            <MainLayout>
              <LocationForm />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/documents"
        element={
          <ProtectedRoute>
            <MainLayout>
              <DocumentsList />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/documents/new"
        element={
          <ProtectedRoute>
            <MainLayout>
              <DocumentForm />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/documents/:id"
        element={
          <ProtectedRoute>
            <MainLayout>
              <DocumentDetail />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/moves"
        element={
          <ProtectedRoute>
            <MainLayout>
              <MovesList />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/reorder-rules"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ReorderRulesList />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reorder-rules/new"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ReorderRuleForm />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reorder-rules/:id/edit"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ReorderRuleForm />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Profile />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      
      {/* 404 fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
