import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext.jsx';
import { ThemeProvider } from './components/ThemeContext.jsx';
import Sidebar, { MobileTopbar, useSidebar } from './components/Sidebar.jsx';
import { ParticipantAuthProvider, useParticipantAuth } from './participants/ParticipantAuthContext.jsx';
import { ParticipantShell } from './participants/ParticipantShell.jsx';
import ParticipantLogin from './participants/ParticipantLogin.jsx';
import ParticipantRegister from './participants/ParticipantRegister.jsx';
import {
  HomeIcon, WarehouseIcon, FinanceIcon, AuctionIcon, SettlementIcon,
  ReceiptIcon, CoinsIcon, ClipboardCheckIcon, HistoryIcon
} from './components/icons.jsx';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Warehouse from './pages/Warehouse.jsx';
import Financing from './pages/Financing.jsx';
import Auction from './pages/Auction.jsx';
import Settlements from './pages/Settlements.jsx';

import FinancerOverview from './pages/financer/Overview.jsx';
import FinancerMarketplace from './pages/financer/Marketplace.jsx';
import FinancerOffers from './pages/financer/Offers.jsx';
import FinancerLoans from './pages/financer/Loans.jsx';

import WspOverview from './pages/wsp/Overview.jsx';
import WspBookings from './pages/wsp/Bookings.jsx';
import WspStockIntake from './pages/wsp/StockIntake.jsx';
import WspIssueWr from './pages/wsp/IssueWr.jsx';
import WspApprovals from './pages/wsp/Approvals.jsx';

import AdminOverview from './pages/admin/Overview.jsx';
import AdminWarehouses from './pages/admin/Warehouses.jsx';
import AdminAuctions from './pages/admin/Auctions.jsx';
import AdminSettlements from './pages/admin/Settlements.jsx';
import AdminApprovals from './pages/admin/Approvals.jsx';
import AdminAuditLog from './pages/admin/AuditLog.jsx';
import AdminInbox from './pages/admin/Inbox.jsx';

import PublicLayout from './public/PublicLayout.jsx';
import NotFound from './public/pages/NotFound.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import LandingPage from './public/pages/LandingPage.jsx';
import Demo from './public/pages/Demo.jsx';
import About from './public/pages/About.jsx';
import HowItWorks from './public/pages/HowItWorks.jsx';
import ForFarmers from './public/pages/ForFarmers.jsx';
import ForFinancers from './public/pages/ForFinancers.jsx';
import ForWarehouses from './public/pages/ForWarehouses.jsx';
import Market from './public/pages/Market.jsx';
import Security from './public/pages/Security.jsx';
import FAQ from './public/pages/FAQ.jsx';
import Contact from './public/pages/Contact.jsx';
import PrivacyPolicy from './public/pages/PrivacyPolicy.jsx';
import Terms from './public/pages/Terms.jsx';
import CookiePolicy from './public/pages/CookiePolicy.jsx';
import CookiePreferences from './public/pages/CookiePreferences.jsx';
import Disclaimer from './public/pages/Disclaimer.jsx';
import Grievance from './public/pages/Grievance.jsx';
import Accessibility from './public/pages/Accessibility.jsx';
import HelpCenter from './public/pages/HelpCenter.jsx';

function Protected({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function Shell({ children }) {
  const { farmer } = useAuth();
  const sidebar = useSidebar();

  if (!farmer) return children; // Login/Register render their own full-page auth layout

  return (
    <div className="app-shell">
      <Sidebar open={sidebar.open} onClose={sidebar.close} />
      <div className="main-col">
        <MobileTopbar onMenu={sidebar.toggle} open={sidebar.open} />
        <main className="content">{children}</main>
      </div>
    </div>
  );
}

/** One of these wraps each staff portal's route subtree, providing its own auth + shell.
 *  registerConfig is optional — only Financer/WSP-CM offer public self-registration; Admin doesn't.
 *  identifierLabel/identifierType let Admin use a plain username field instead of an email one. */
function ParticipantPortal({ role, brandTag, navItems, loginPath, redirectAfterLogin, loginTitle, loginSubtitle, demoHint, registerConfig, identifierLabel, identifierType, children }) {
  return (
    <ParticipantAuthProvider role={role}>
      <ParticipantPortalRoutes
        loginPath={loginPath}
        redirectAfterLogin={redirectAfterLogin}
        loginTitle={loginTitle}
        loginSubtitle={loginSubtitle}
        demoHint={demoHint}
        registerConfig={registerConfig}
        navItems={navItems}
        brandTag={brandTag}
        identifierLabel={identifierLabel}
        identifierType={identifierType}
      >
        {children}
      </ParticipantPortalRoutes>
    </ParticipantAuthProvider>
  );
}

function ParticipantProtected({ loginPath, children }) {
  const { isAuthenticated } = useParticipantAuth();
  if (!isAuthenticated) return <Navigate to={loginPath} replace />;
  return children;
}

function ParticipantPortalRoutes({ loginPath, redirectAfterLogin, loginTitle, loginSubtitle, demoHint, registerConfig, navItems, brandTag, identifierLabel, identifierType, children }) {
  return (
    <Routes>
      <Route
        path="login"
        element={<ParticipantShell navItems={navItems} brandTag={brandTag}><ParticipantLogin title={loginTitle} subtitle={loginSubtitle} redirectTo={redirectAfterLogin} demoHint={demoHint} identifierLabel={identifierLabel} identifierType={identifierType} /></ParticipantShell>}
      />
      {registerConfig && (
        <Route
          path="register"
          element={<ParticipantShell navItems={navItems} brandTag={brandTag}><ParticipantRegister {...registerConfig} redirectTo={redirectAfterLogin} loginPath={loginPath} /></ParticipantShell>}
        />
      )}
      <Route
        path="*"
        element={
          <ParticipantProtected loginPath={loginPath}>
            <ParticipantShell navItems={navItems} brandTag={brandTag}>{children}</ParticipantShell>
          </ParticipantProtected>
        }
      />
    </Routes>
  );
}

const FINANCER_NAV = [
  { to: '/financer/overview', label: 'Overview', icon: HomeIcon },
  { to: '/financer/marketplace', label: 'Marketplace', icon: WarehouseIcon },
  { to: '/financer/offers', label: 'My Offers', icon: ReceiptIcon },
  { to: '/financer/loans', label: 'Active Loans', icon: CoinsIcon }
];
const WSP_NAV = [
  { to: '/wsp/overview', label: 'Overview', icon: HomeIcon },
  { to: '/wsp/bookings', label: 'Bookings', icon: WarehouseIcon },
  { to: '/wsp/stock-intake', label: 'Stock Intake', icon: ReceiptIcon },
  { to: '/wsp/issue-wr', label: 'Issue WR', icon: SettlementIcon },
  { to: '/wsp/approvals', label: 'Approvals', icon: ClipboardCheckIcon }
];
const ADMIN_NAV = [
  { to: '/admin/overview', label: 'Overview', icon: HomeIcon },
  { to: '/admin/warehouses', label: 'Warehouses', icon: WarehouseIcon },
  { to: '/admin/auctions', label: 'Auctions', icon: AuctionIcon },
  { to: '/admin/settlements', label: 'Settlements', icon: SettlementIcon },
  { to: '/admin/approvals', label: 'Approvals', icon: ClipboardCheckIcon },
  { to: '/admin/inbox', label: 'Inbox', icon: ReceiptIcon },
  { to: '/admin/audit-log', label: 'Audit Log', icon: HistoryIcon }
];

function FinancerRoutes() {
  return (
    <Routes>
      <Route path="overview" element={<FinancerOverview />} />
      <Route path="marketplace" element={<FinancerMarketplace />} />
      <Route path="offers" element={<FinancerOffers />} />
      <Route path="loans" element={<FinancerLoans />} />
      <Route path="*" element={<Navigate to="/financer/overview" replace />} />
    </Routes>
  );
}
function WspRoutes() {
  return (
    <Routes>
      <Route path="overview" element={<WspOverview />} />
      <Route path="bookings" element={<WspBookings />} />
      <Route path="stock-intake" element={<WspStockIntake />} />
      <Route path="issue-wr" element={<WspIssueWr />} />
      <Route path="approvals" element={<WspApprovals />} />
      <Route path="*" element={<Navigate to="/wsp/overview" replace />} />
    </Routes>
  );
}
function AdminRoutes() {
  return (
    <Routes>
      <Route path="overview" element={<AdminOverview />} />
      <Route path="warehouses" element={<AdminWarehouses />} />
      <Route path="auctions" element={<AdminAuctions />} />
      <Route path="settlements" element={<AdminSettlements />} />
      <Route path="approvals" element={<AdminApprovals />} />
      <Route path="inbox" element={<AdminInbox />} />
      <Route path="audit-log" element={<AdminAuditLog />} />
      <Route path="*" element={<Navigate to="/admin/overview" replace />} />
    </Routes>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/demo" element={<PublicLayout><Demo /></PublicLayout>} />
      <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
      <Route path="/how-it-works" element={<PublicLayout><HowItWorks /></PublicLayout>} />
      <Route path="/for-farmers" element={<PublicLayout><ForFarmers /></PublicLayout>} />
      <Route path="/for-financers" element={<PublicLayout><ForFinancers /></PublicLayout>} />
      <Route path="/for-warehouses" element={<PublicLayout><ForWarehouses /></PublicLayout>} />
      <Route path="/market" element={<PublicLayout><Market /></PublicLayout>} />
      <Route path="/security" element={<PublicLayout><Security /></PublicLayout>} />
      <Route path="/faq" element={<PublicLayout><FAQ /></PublicLayout>} />
      <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
      <Route path="/privacy" element={<PublicLayout><PrivacyPolicy /></PublicLayout>} />
      <Route path="/terms" element={<PublicLayout><Terms /></PublicLayout>} />
      <Route path="/cookies" element={<PublicLayout><CookiePolicy /></PublicLayout>} />
      <Route path="/cookie-preferences" element={<PublicLayout><CookiePreferences /></PublicLayout>} />
      <Route path="/disclaimer" element={<PublicLayout><Disclaimer /></PublicLayout>} />
      <Route path="/grievance" element={<PublicLayout><Grievance /></PublicLayout>} />
      <Route path="/accessibility" element={<PublicLayout><Accessibility /></PublicLayout>} />
      <Route path="/help" element={<PublicLayout><HelpCenter /></PublicLayout>} />

      <Route path="/login" element={<Shell><Login /></Shell>} />
      <Route path="/register" element={<Shell><Register /></Shell>} />
      <Route path="/dashboard" element={<Protected><Shell><Dashboard /></Shell></Protected>} />
      <Route path="/warehouse" element={<Protected><Shell><Warehouse /></Shell></Protected>} />
      <Route path="/financing" element={<Protected><Shell><Financing /></Shell></Protected>} />
      <Route path="/auction" element={<Protected><Shell><Auction /></Shell></Protected>} />
      <Route path="/settlements" element={<Protected><Shell><Settlements /></Shell></Protected>} />

      <Route path="/financer/*" element={
        <ParticipantPortal
          role="FINANCER" brandTag="Financer Portal" navItems={FINANCER_NAV}
          loginPath="/financer/login" redirectAfterLogin="/financer/overview"
          loginTitle="Financer sign in" loginSubtitle="Review the financing marketplace, manage offers and monitor your loan book."
          demoHint="Demo login: financer@demo.kisanunnatti.in / Demo@123"
          registerConfig={{ title: 'Register as a Financer', subtitle: 'Create your organization\u2019s financer account.', orgLabel: 'Organization / NBFC name' }}
        >
          <FinancerRoutes />
        </ParticipantPortal>
      } />

      <Route path="/wsp/*" element={
        <ParticipantPortal
          role="WSP_CM" brandTag="Warehouse Portal" navItems={WSP_NAV}
          loginPath="/wsp/login" redirectAfterLogin="/wsp/overview"
          loginTitle="WSP/CM sign in" loginSubtitle="Record bookings, stock intake and issue digital warehouse receipts."
          demoHint="Demo login: wsp@demo.kisanunnatti.in / Demo@123"
          registerConfig={{ title: 'Register your Warehouse', subtitle: 'Create your WSP/CM operator account.', orgLabel: 'Warehouse / WSP-CM company name' }}
        >
          <WspRoutes />
        </ParticipantPortal>
      } />

      <Route path="/admin/*" element={
        <ParticipantPortal
          role="ADMIN" brandTag="Admin Portal" navItems={ADMIN_NAV}
          loginPath="/admin/login" redirectAfterLogin="/admin/overview"
          loginTitle="Admin sign in" loginSubtitle="Platform-wide oversight: warehouses, auctions, settlements and the audit trail."
          identifierLabel="Username" identifierType="text"
        >
          <AdminRoutes />
        </ParticipantPortal>
      } />

      <Route path="/404" element={<PublicLayout><NotFound /></PublicLayout>} />
      <Route path="*" element={<PublicLayout><NotFound /></PublicLayout>} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
