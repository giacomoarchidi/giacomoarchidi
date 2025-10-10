import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProfileCreation from './pages/ProfileCreation';

// Import dashboard components
import StudentDashboard from './pages/student/StudentDashboard';
import AssignmentsPage from './pages/student/AssignmentsPage';
import TutorDashboard from './pages/tutor/TutorDashboard';
import AvailabilityPage from './pages/tutor/AvailabilityPage';
import TutorAssignmentsPage from './pages/tutor/AssignmentsPage';
import ParentDashboard from './pages/parent/ParentDashboard';
import BookLesson from './pages/lessons/BookLesson';
import VideoRoom from './pages/lessons/VideoRoom';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Homepage Route */}
          <Route path="/" element={<HomePage />} />
          
          {/* Profile Creation Route */}
          <Route path="/create-profile" element={<ProfileCreation />} />
          
          {/* Dashboard Routes */}
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/assignments" element={<AssignmentsPage />} />
          <Route path="/tutor/dashboard" element={<TutorDashboard />} />
          <Route path="/tutor/availability" element={<AvailabilityPage />} />
          <Route path="/tutor/assignments" element={<TutorAssignmentsPage />} />
          <Route path="/parent/dashboard" element={<ParentDashboard />} />
          
          {/* Lessons Routes */}
          <Route path="/lessons/book" element={<BookLesson />} />
          <Route path="/lessons/:lessonId/video" element={<VideoRoom />} />
          
          {/* Fallback Route */}
          <Route path="*" element={<HomePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;