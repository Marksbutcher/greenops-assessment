import { Routes, Route, Navigate } from 'react-router-dom';
import Welcome from './pages/Welcome';
import DomainList from './pages/DomainList';
import QuestionScreen from './pages/QuestionScreen';
import Results from './pages/Results';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/assess" element={<DomainList />} />
      <Route path="/assess/:domainId/:questionIndex" element={<QuestionScreen />} />
      <Route path="/results" element={<Results />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
