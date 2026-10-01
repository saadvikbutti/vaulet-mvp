import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout.jsx";
import AuthLayout from "./layouts/AuthLayout.jsx";
import VauletLayout from "./layouts/VauletLayout.jsx";
import { GuestRoute, ProtectedRoute } from "./layouts/RouteGuards.jsx";
import AuthForm from "./components/AuthForm.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import VauletsPage from "./pages/VauletsPage.jsx";
import CreateVauletPage from "./pages/CreateVauletPage.jsx";
import VauletOverviewPage from "./pages/VauletOverviewPage.jsx";
import WalletPage from "./pages/WalletPage.jsx";
import TransactionsPage from "./pages/TransactionsPage.jsx";
import MembersPage from "./pages/MembersPage.jsx";
import MemoriesPage from "./pages/MemoriesPage.jsx";
import PlannerPage from "./pages/PlannerPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route element={<GuestRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<AuthForm mode="login" />} />
          <Route path="/signup" element={<AuthForm mode="signup" />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/vaulets" element={<VauletsPage />} />
          <Route path="/vaulets/new" element={<CreateVauletPage />} />
          <Route path="/vaulets/:id" element={<VauletLayout />}>
            <Route index element={<VauletOverviewPage />} />
            <Route path="wallet" element={<WalletPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="memories" element={<MemoriesPage />} />
            <Route path="members" element={<MembersPage />} />
          </Route>
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
