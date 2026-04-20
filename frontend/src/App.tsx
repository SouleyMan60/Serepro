import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";

// SEREPRO pages
import Employes from "./pages/Employes";
import Contrats from "./pages/Contrats";
import Echeancier from "./pages/Echeancier";
import Avance from "./pages/Avance";
import Credit from "./pages/Credit";
import Archivage from "./pages/Archivage";

// Auth
import { AuthProvider, useAuth, AuthLoadingSpinner } from "./context/AuthContext";
import Register from "./pages/Auth/Register";

// Protège AppLayout : redirige vers /signin si non authentifié
function ProtectedLayout() {
  const { user, loading } = useAuth();
  if (loading) return <AuthLoadingSpinner />;
  if (!user) return <Navigate to="/signin" replace />;
  return <AppLayout />;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          {/* Routes protégées — nécessitent une session Firebase active */}
          <Route element={<ProtectedLayout />}>
            <Route index path="/" element={<Home />} />

            {/* SEREPRO routes */}
            <Route path="/employes" element={<Employes />} />
            <Route path="/contrats" element={<Contrats />} />
            <Route path="/echeancier" element={<Echeancier />} />
            <Route path="/avance" element={<Avance />} />
            <Route path="/credit" element={<Credit />} />
            <Route path="/archivage" element={<Archivage />} />

            {/* Others Page */}
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />

            {/* Forms */}
            <Route path="/form-elements" element={<FormElements />} />

            {/* Tables */}
            <Route path="/basic-tables" element={<BasicTables />} />

            {/* Ui Elements */}
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />

            {/* Charts */}
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
          </Route>

          {/* Routes publiques */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/register" element={<Register />} />

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
