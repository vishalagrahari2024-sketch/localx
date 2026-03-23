import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import ThemeProvider from "./components/ThemeProvider";
import Navbar from "./components/Navbar";
import LoginPage from "./components/LoginPage";
import SignupPage from "./components/SignupPage";
import ProtectedRoute from "./components/ProtectedRoute";
import ResetPassword from "./components/ResetPassword";
import CompleteProfile from "./components/CompleteProfile";
import LandingPage from "./pages/LandingPage";
import HomeFeed from "./pages/HomeFeed";
import UserProfile from "./pages/UserProfile";
import MessagesPage from "./pages/MessagesPage";
import AdminDashboard from "./pages/AdminDashboard";
import SearchPage from "./pages/SearchPage";
import GroupsPage from "./pages/GroupsPage";

function AppLayout() {
  const location = useLocation();
  const noNavbarPaths = ["/", "/signup", "/reset-password", "/complete-profile", "/landing"];
  const hideNavbar = noNavbarPaths.includes(location.pathname);

  return (
    <div className="app-root">
      {!hideNavbar && <Navbar />}
      <div className={!hideNavbar ? "app-content" : ""}>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />
          <Route path="/home" element={<ProtectedRoute><HomeFeed /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/profile/:userId" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
          <Route path="/groups" element={<ProtectedRoute><GroupsPage /></ProtectedRoute>} />
          <Route path="/groups/:groupId" element={<ProtectedRoute><GroupsPage /></ProtectedRoute>} />
        </Routes>
      </div>
    </div>
  );
}

const App = () => (
  <ThemeProvider>
    <Router>
      <AppLayout />
    </Router>
  </ThemeProvider>
);

export default App;
