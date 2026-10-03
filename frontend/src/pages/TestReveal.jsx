// src/pages/TestReveal.jsx
import { useLocation, useParams, useNavigate } from "react-router-dom";
import OnboardingReveal from "../components/OnboardingReveal";

export default function TestReveal() {
  const { element, city } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <OnboardingReveal
      element={element}
      cityName={city.toUpperCase()}
      onComplete={() => {
        const { onboardingKey } = location.state || {};
        if (onboardingKey) {
          localStorage.setItem(onboardingKey, "true");
        }
        navigate("/home");
      }}
    />
  );
}