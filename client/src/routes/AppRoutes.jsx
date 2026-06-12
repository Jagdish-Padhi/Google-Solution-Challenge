import { useEffect } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';

import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import CreatorLayout from '../pages/creator/CreatorLayout.jsx';
import LoginPage from '../pages/auth/LoginPage.jsx';
import LandingPage from '../pages/landing/LandingPage.jsx';
import RegisterPage from '../pages/auth/RegisterPage.jsx';
import DashboardHomePage from '../pages/dashboard/DashboardHomePage.jsx';
import DashboardAssetsPage from '../pages/dashboard/DashboardAssetsPage.jsx';
import DashboardStreamsPage from '../pages/dashboard/DashboardStreamsPage.jsx';
import DashboardScansPage from '../pages/dashboard/DashboardScansPage.jsx';
import DashboardScanResultsPage from '../pages/dashboard/DashboardScanResultsPage.jsx';
import DashboardAlertsPage from '../pages/dashboard/DashboardAlertsPage.jsx';
import DashboardAnalyticsPage from '../pages/dashboard/DashboardAnalyticsPage.jsx';
import DashboardViolationsPage from '../pages/dashboard/DashboardViolationsPage.jsx';
import DashboardSettingsPage from '../pages/dashboard/DashboardSettingsPage.jsx';
import CreatorHomePage from '../pages/creator/CreatorHomePage.jsx';
import CreatorFindingsPage from '../pages/creator/CreatorFindingsPage.jsx';
import useAuthStore from '../store/auth.store.js';
import GlobalLoader from '../components/loaders/GlobalLoader.jsx';

function PrivateRoute({ requiredRole }) {
	const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
	const getIsCreator = useAuthStore((state) => state.getIsCreator);

	if (!isLoggedIn) {
		return <Navigate to='/login' replace />;
	}

	const isCreator = getIsCreator();

	if (requiredRole === 'creator' && !isCreator) {
		return <Navigate to='/dashboard' replace />;
	}

	if (requiredRole === 'broadcaster' && isCreator) {
		return <Navigate to='/creator' replace />;
	}

	return <Outlet />;
}

export default function AppRoutes() {
	const location = useLocation();
	const hydrated = useAuthStore((state) => state.hydrated);
	const isTransitioning = useAuthStore((state) => state.isTransitioning);
	const isExiting = useAuthStore((state) => state.isExiting);
	const transitionShowTagline = useAuthStore((state) => state.transitionShowTagline);
	const setTransitioning = useAuthStore((state) => state.setTransitioning);
	const setExiting = useAuthStore((state) => state.setExiting);

	useEffect(() => {
		if (isTransitioning && !isExiting) {
			// Trigger exit animation after a short delay to ensure route is mounted
			const timer = setTimeout(() => {
				setExiting(true);
				setTimeout(() => {
					setTransitioning(false);
				}, 600); // Match index.css duration
			}, 300);
			return () => clearTimeout(timer);
		}
	}, [location.pathname, isTransitioning, isExiting]);

	if (!hydrated) {
		return <GlobalLoader showTagline={false} />;
	}

	return (
		<>
			{(isTransitioning || isExiting) && (
				<GlobalLoader showTagline={transitionShowTagline} isExiting={isExiting} />
			)}
			<Routes>
				<Route path='/' element={<LandingPage />} />
				<Route path='/login' element={<LoginPage />} />
				<Route path='/register' element={<RegisterPage />} />
				
				{/* Broadcaster Flow */}
				<Route element={<PrivateRoute requiredRole="broadcaster" />}>
					<Route element={<DashboardLayout />}>
						<Route path='/dashboard' element={<DashboardHomePage />} />
						<Route path='/dashboard/assets' element={<DashboardAssetsPage />} />
						<Route path='/dashboard/streams' element={<DashboardStreamsPage />} />
						<Route path='/dashboard/scans' element={<DashboardScansPage />} />
						<Route path='/dashboard/scans/:jobId' element={<DashboardScanResultsPage />} />
						<Route path='/dashboard/analytics' element={<DashboardAnalyticsPage />} />
						<Route path='/dashboard/alerts' element={<DashboardAlertsPage />} />
						<Route path='/dashboard/violations' element={<DashboardViolationsPage />} />
						<Route path='/dashboard/violations/:violationId' element={<DashboardViolationsPage />} />
						<Route path='/dashboard/settings' element={<DashboardSettingsPage />} />
					</Route>
				</Route>

				{/* Creator Flow */}
				<Route element={<PrivateRoute requiredRole="creator" />}>
					<Route element={<CreatorLayout />}>
						<Route path='/creator' element={<CreatorHomePage />} />
						<Route path='/creator/findings' element={<CreatorFindingsPage />} />
						<Route path='/creator/account' element={<DashboardSettingsPage />} />
					</Route>
				</Route>

				<Route path='*' element={<Navigate to='/' replace />} />
			</Routes>
		</>
	);
}
