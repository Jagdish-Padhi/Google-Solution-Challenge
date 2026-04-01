import { Navigate, Route, Routes } from 'react-router-dom';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<div>Login Page Template</div>} />
      <Route path="/register" element={<div>Register Page Template</div>} />
      <Route path="/dashboard" element={<div>Dashboard Template</div>} />
      <Route path="*" element={<div>404 - Page Not Found</div>} />
    </Routes>
  );
}

export default App;
