import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProductDetailPage from './pages/ProductDetailPage';
import AuctionDetailPage from './pages/AuctionDetailPage';
import BrowsePage from './pages/BrowsePage';
import CategoryPage from './pages/CategoryPage';
import CartPage from './pages/CartPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
// Management Pages
import ManagementDashboard from './pages/management/ManagementDashboard';
import CreateProductPage from './pages/management/CreateProductPage';
import AllProductsPage from './pages/management/AllProductsPage';
import ManageProductPage from './pages/management/ManageProductPage';
import EditProductPage from './pages/management/EditProductPage';
import AuctionParticipantsPage from './pages/management/AuctionParticipantsPage';
import AuctionBidsPage from './pages/management/AuctionBidsPage';
import OrdersListPage from './pages/management/OrdersListPage';
import OrderDetailPage from './pages/management/OrderDetailPage';
import ProductBuyersPage from './pages/management/ProductBuyersPage';
import CategoriesPage from './pages/management/CategoriesPage';
import UsersPage from './pages/management/UsersPage';
import CategoryList from './pages/CategoryList';
import CategoryDetail from './pages/CategoryDetail';
import BuyNowPage from "./pages/BuyNowPage";
import CreateNextRoundPage from './pages/management/CreateNextRoundPage';
import RoundBids from './pages/management/RoundBids'; // <- import the page
import RoundParticipants from "./pages/management/RoundParticipants";
import AuctionRoundsTab from './pages/management/AuctionRoundsTab';
import RoundDetailPage from './pages/management/RoundDetailPage';






const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/auction/:id" element={<AuctionDetailPage />} />
            <Route path="/browse" element={<BrowsePage />} />
            <Route path="/category/:categorySlug" element={<CategoryPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/categories" element={<CategoryList />} />
            <Route path="/buy-now" element={<BuyNowPage />} />
            

            {/* Management Routes (Superuser Only) */}
            <Route 
              path="/management" 
              element={
                <ProtectedRoute requireSuperuser={true}>
                  <ManagementDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/management/products/new" 
              element={
                <ProtectedRoute requireSuperuser={true}>
                  <CreateProductPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/management/products" 
              element={
                <ProtectedRoute requireSuperuser={true}>
                  <AllProductsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/management/products/:id/edit" 
              element={
                <ProtectedRoute requireSuperuser={true}>
                  <EditProductPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/management/products/:id" 
              element={
                <ProtectedRoute requireSuperuser={true}>
                  <ManageProductPage />
                </ProtectedRoute>
              } 
            />

            {/* Auction Management - Participants & Bids */}
            <Route 
              path="/management/auctions/:id/participants" 
              element={
                <ProtectedRoute requireSuperuser={true}>
                  <AuctionParticipantsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/management/auctions/:id/bids" 
              element={
                <ProtectedRoute requireSuperuser={true}>
                  <AuctionBidsPage />
                </ProtectedRoute>
              } 
            />

            {/* Product Buyers */}
            <Route 
              path="/management/products/:id/buyers" 
              element={
                <ProtectedRoute requireSuperuser={true}>
                  <ProductBuyersPage />
                </ProtectedRoute>
              } 
            />

            {/* Orders Management */}
            <Route 
              path="/management/orders" 
              element={
                <ProtectedRoute requireSuperuser={true}>
                  <OrdersListPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/management/orders/:id" 
              element={
                <ProtectedRoute requireSuperuser={true}>
                  <OrderDetailPage />
                </ProtectedRoute>
              } 
            />

            {/* Categories Management */}
            <Route 
              path="/management/categories" 
              element={
                <ProtectedRoute requireSuperuser={true}>
                  <CategoriesPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/management/category/:id" 
              element={
                <ProtectedRoute requireSuperuser={true}>
                  <CategoryDetail />
                </ProtectedRoute>
              } 
            />


            {/* Users Management */}
            <Route 
              path="/management/users" 
              element={
                <ProtectedRoute requireSuperuser={true}>
                  <UsersPage />
                </ProtectedRoute>
              } 
            />

            <Route
              path="/management/products/:id/create-next-round"
              element={<CreateNextRoundPage />}
            />

            {/* Auction Management - Round Bids */}
            <Route
              path="/management/auctions/:productId/round/:roundId/bids"
              element={
                <ProtectedRoute requireSuperuser={true}>
                  <RoundBids />
                </ProtectedRoute>
              }
            />

            {/* <Route
              path="/management/auctions/:productId/round/:roundId/participants"
              element={
                <ProtectedRoute requireSuperuser={true}>
                  <RoundParticipants />
                </ProtectedRoute>
              }
            /> */}

            <Route
              path="/management/auctions/:productId/rounds"
              element={
                <ProtectedRoute requireSuperuser={true}>
                  <AuctionRoundsTab />
                </ProtectedRoute>
              }
            />

         <Route
  path="/management/products/:productId/rounds/:roundId"
  element={
    <ProtectedRoute requireSuperuser={true}>
      <RoundDetailPage />
    </ProtectedRoute>
  }
/>




            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
