# Gradevity

Gradevity is a full-stack web application designed to help university students seamlessly track their academic performance. Built as a comprehensive academic tool, it allows users to calculate their current semester GPA, monitor their overall CGPA across multiple semesters, and strategically plan for future target scores.

The project emphasizes a clean, responsive user interface and integrates a custom WebGL-based visual background for a modern aesthetic.

## Features

- **Dynamic GPA Calculation:** Compute semester GPAs by adding individual courses with their respective credit hours and grades.
- **Historical Tracking (CGPA):** Maintain a record of past semesters to calculate an accurate, cumulative GPA over time.
- **Target Planning:** Input a desired future CGPA to determine the exact grades required in upcoming semesters to achieve that goal.
- **Cloud Persistence:** Secure user authentication allowing students to save their progress and access it from any device.
- **Modern UI/UX:** Features a custom-built WebGL metaball background, glassmorphism design elements, and seamless dark/light mode toggling.

## Technical Stack

**Frontend:**
- React 19 (via Vite)
- Three.js (for WebGL background rendering)
- React Router (for client-side routing)
- Vanilla CSS (for custom styling and glassmorphic panels)

**Backend:**
- Node.js & Express.js
- MongoDB & Mongoose (Database and ODM)
- JWT & bcryptjs (Authentication and security)

## Getting Started

To run this project locally on your machine, follow these steps:

### Prerequisites
- Node.js (v18 or higher)
- A running MongoDB instance (or a MongoDB Atlas URI)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/A9Sarthak/Gradevity.git
   cd Gradevity
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory and configure your MongoDB connection and JWT secret:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

4. **Run the development server**
   This project uses `concurrently` to run both the frontend and backend simultaneously.
   ```bash
   npm run dev
   ```

5. **Access the application**
   Open your browser and navigate to `http://localhost:5173`.

## Technical Highlights

As a student project, Gradevity was built to explore several advanced web development concepts:
- **Optimized Rendering:** The WebGL background is designed to pause when not in the viewport, ensuring that the application remains lightweight and performant even on lower-end devices.
- **State Management:** Complex calculations for the target CGPA and semester aggregations are handled efficiently within React components, minimizing unnecessary re-renders.
- **Responsive Layout:** The dashboard seamlessly shifts from a comprehensive desktop layout to a mobile-friendly card system, ensuring usability across all platforms.
