import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./components/Landing";
import AuthPage from "./pages/AuthPage";
import HomePage from './pages/HomePage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/home" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}