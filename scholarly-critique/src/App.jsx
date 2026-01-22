import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import UserProvider, { useUser } from "./context/UserContext"
import { LayoutProvider, LayoutContext } from "./context/layoutContext";

import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import Welcome from './pages/Dashboard/Welcome';
import Home from './pages/Dashboard/Home';
import Topics from './pages/Dashboard/topics';
import FAQ from './pages/Dashboard/faq';
import Signup2 from './pages/Auth/SignUp_2';
import Signup3 from './pages/Auth/SignUp_3';
import Signup4 from './pages/Auth/SignUp_4';
import Signup5 from './pages/Auth/SignUp_5';
import Signup6 from './pages/Auth/SignUp_6';
import Signup7 from './pages/Auth/SignUp_7';
import Signup8 from './pages/Auth/SignUp_8';
import Profile from './pages/Dashboard/Profile';
import MyEssays from './pages/Dashboard/MyEssays';
import TopicsDashboard from './pages/Dashboard/TopicsDashboard';
import MyReviews from './pages/Dashboard/MyReviews';
import BrowseEssays from './pages/Dashboard/BrowseEssays';
import Congrats from './pages/Dashboard/Congrats';
import UploadEssay from './pages/Dashboard/UploadEssay';
import Critique from "./pages/Dashboard/Critique";
import EssayView from "./pages/Dashboard/EssayView";



const PrivateRoute = () => {
   const { isAuthenticated, user, loading } = useUser();
   if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

   const onboarding = user?.onboarding || {};
   const completed = Boolean(onboarding.completed);
   const step = Number(onboarding.step || 1);

   // Map onboarding step -> route
   const stepPath =
     {
       1: "/signup2",
       2: "/signup3",
       3: "/signup4",
       4: "/signup5",
       5: "/signup6",
       6: "/signup7",
       7: "/signup8",
     }[step] || "/signup2";

   // If not completed and not already on the required step, push them there
   const current = window.location.pathname;
   if (!completed && current !== stepPath) {
    return <Navigate to={stepPath} replace />;
   }
   return <Outlet />;
 };

const PublicRoute = () => {
   const { isAuthenticated, user } = useUser();
   if (!isAuthenticated) return <Outlet />;
   // If logged in but onboarding incomplete, let PrivateRoute gate handle redirect
   return <Navigate to="/dashboard" replace />;
};

const App = () => (
  
  <UserProvider>
    <LayoutProvider>
    <Router>
      <Routes>
        {/* Public */}
        <Route element={<PublicRoute />}>
          
          <Route path="/" element={<Navigate to="/welcome" replace />} />
        <Route path="/welcome" element={<Welcome />} />
          <Route path="/topics" element={<Topics />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        {/* Private */}
        <Route element={<PrivateRoute />}>
          
          <Route path="/dashboard" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/my-essays" element={<MyEssays />} />
          <Route path="/topics-dashboard" element={<TopicsDashboard />} />
          <Route path="/my-reviews" element={<MyReviews />} />
          <Route path="/browse-essays" element={<BrowseEssays/>} />
          <Route path="/congrats" element={<Congrats />} />
          <Route path="/upload-essay" element={<UploadEssay/>} />
          <Route path="/essays/:id/critique" element={<Critique />} />
          <Route path="/essays/:id" element={<EssayView />} />
          
          <Route path="/signup2" element={<Signup2 />} />
          <Route path="/signup3" element={<Signup3 />} />
          <Route path="/signup4" element={<Signup4 />} />
          <Route path="/signup5" element={<Signup5 />} />
          <Route path="/signup6" element={<Signup6 />} />
          <Route path="/signup7" element={<Signup7 />} />
          <Route path="/signup8" element={<Signup8 />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
    </LayoutProvider>
  </UserProvider>
  
);

export default App;