# 🍃 MongoAcademy LMS

A professional-grade, interactive Learning Management System (LMS) designed to teach MongoDB through a theory-first curriculum and hands-on practice modules.

![LMS Preview](https://img.shields.io/badge/Status-Active-brightgreen)
![Tech](https://img.shields.io/badge/Stack-Spring%20Boot%20%2B%20MySQL%20%2B%20Vanilla%20JS-blue)

## 🚀 Overview

MongoAcademy is a full-stack application that provides students with a structured learning path for MongoDB. It combines high-quality theoretical content with an integrated "Practice Mode" where students can execute MongoDB queries against a mock engine that translates results in real-time.

---

## ✨ Key Features

### 📖 Structured Curriculum
- **Module-Based Learning**: Lessons are organized into chapters (Basics, CRUD, Query Operators, Aggregation).
- **Dynamic Content**: Content is served directly from the backend file system, allowing for easy curriculum updates.

### 💻 Interactive Practice Environment
- **Mock MongoDB Engine**: A custom JavaScript-based engine that simulates MongoDB behavior (find, count, operators like `$gt`, `$in`, etc.) against a local data cluster.
- **Real-time Console**: Immediate feedback on query execution with formatted JSON output.
- **Automated Validation**: Practice challenges are automatically graded by comparing query results against a hidden solution key.

### 👤 User Experience & Progress
- **Persistent Tracking**: Progress is saved to a MySQL database, ensuring students can pick up where they left off.
- **Authentication**: Integrated with **Firebase Auth** for secure Google and Email/Password login.
- **Premium Design**: A modern, dark-themed UI featuring glassmorphism, responsive layouts, and smooth micro-animations.

---

## 🛠️ Technology Stack

### **Backend (Java Spring Boot)**
- **Spring Data JPA**: For MySQL persistence.
- **Spring Security**: To handle API security and CORS.
- **MySQL**: Relational database for user data and progress tracking.
- **REST APIs**: Endpoints for lessons, data synchronization, and progress management.

### **Frontend (Vanilla Web)**
- **HTML5/CSS3**: Custom design system with CSS variables and glassmorphism.
- **JavaScript (ES6+)**: Modular architecture for the engine, authentication, and dashboard logic.
- **Firebase SDK**: For seamless authentication.
- **FontAwesome**: For high-quality iconography.

---

## 📂 Project Structure

```text
mongodb_lms/
├── backend/                # Java Spring Boot Application
│   ├── src/                # Source code
│   ├── content/            # Curriculum & Practice HTML files
│   └── pom.xml             # Maven dependencies
├── frontend/               # Web Application Assets
│   ├── css/                # Design system & component styles
│   ├── js/                 # Auth, Engine, and Dashboard logic
│   ├── dashboard.html      # Main learning platform
│   └── login.html          # Authentication entry point
└── README.md               # Project documentation
```

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- Java 17+
- MySQL Server
- Maven

### 2. Database Configuration
Create a database named `lms_db` and update `backend/src/main/resources/application.properties` with your credentials:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/lms_db
spring.datasource.username=YOUR_USERNAME
spring.datasource.password=YOUR_PASSWORD
server.port=8084
```

### 3. Running the Backend
Navigate to the `backend` folder and run:
```bash
mvn spring-boot:run
```

### 4. Accessing the Frontend
The backend serves the frontend static files. Once the server is running, open your browser to:
**`http://localhost:8084/index.html`**

---

## 🤝 Contributing
This project was developed as part of an internship project focused on interactive education platforms.

**Developer:** Sankethakumbar
**Repository:** [mongoDb_lms](https://github.com/Sankethakumbar/mongoDb_lms.git)
