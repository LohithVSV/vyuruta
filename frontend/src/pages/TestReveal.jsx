// src/pages/TestReveal.jsx
import { useParams, useNavigate } from "react-router-dom";
import OnboardingReveal from "../components/onBoardingReveal";

export default function TestReveal() {
  const { element, city } = useParams();
  const navigate = useNavigate();

  return (
    <OnboardingReveal
      element={element}
      cityName={city.toUpperCase()}
      onComplete={() => navigate("/home")}
    />
  );
}