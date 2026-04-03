import { Navigate, Outlet, Route, Routes } from 'react-router-dom';

import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import LoginPage from '../pages/auth/LoginPage.jsx';
import LandingPage from '../pages/landing/LandingPage.jsx';
import RegisterPage from '../pages/auth/RegisterPage.jsx';
import DashboardHomePage from '../pages/dashboard/DashboardHomePage.jsx';
import useAuthStore from '../store/auth.store.js';

function PrivateRoute() {
	const hydrated = useAuthStore((state) => state.hydrated);
	const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

	if (!hydrated) {
		return <div className='flex min-h-screen items-center justify-center text-(--app-color-text-muted)'>Loading secure session...</div>;
	}

	if (!isLoggedIn) {
		return <Navigate to='/login' replace />;
	}

	return <Outlet />;
}

export default function AppRoutes() {
	return (
		<Routes>
			<Route path='/' element={<LandingPage />} />
			<Route path='/login' element={<LoginPage />} />
			<Route path='/register' element={<RegisterPage />} />
			<Route element={<PrivateRoute />}>
				<Route element={<DashboardLayout />}>
					<Route path='/dashboard' element={<DashboardHomePage />} />
				</Route>
			</Route>
			<Route path='*' element={<Navigate to='/' replace />} />
		</Routes>
	);
}
