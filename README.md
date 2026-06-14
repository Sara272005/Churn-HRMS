<div align="center">

# 🚀 Employee Churn Prediction & Retention System

### Intelligent Workforce Analytics Platform for Predicting Employee Attrition and Improving Retention

<p align="center">
A full-stack enterprise application that helps organizations identify employees at risk of leaving, analyze workforce trends, and implement proactive retention strategies through data-driven insights.
</p>

</div>

---

# 📌 Table of Contents

- Overview
- Problem Statement
- Project Objectives
- Key Features
- System Workflow
- Churn Prediction Methodology
- System Architecture
- Technology Stack
- Database Design
- Dashboard Analytics
- Security Features
- Installation & Setup
- Project Structure
- Future Enhancements
- Learning Outcomes
- Author

---

# 📖 Overview

Employee attrition is one of the most significant challenges faced by organizations worldwide. Losing valuable employees affects productivity, increases recruitment costs, delays project delivery, and results in the loss of organizational knowledge.

The Employee Churn Prediction & Retention System is designed to help Human Resource departments proactively identify employees who may be at risk of leaving the organization. The system continuously monitors employee attendance, leave records, performance reviews, overtime workload, and satisfaction survey responses to calculate a churn risk score.

Based on the calculated risk level, the platform generates personalized retention recommendations that enable HR teams to take preventive action before attrition occurs.

This project combines enterprise software development principles with HR analytics to create a practical workforce management solution.

---

# 🎯 Problem Statement

Organizations invest considerable resources in hiring, training, and developing employees. However, employee resignations often occur unexpectedly, creating several challenges:

- Increased recruitment and onboarding costs
- Reduced productivity and team performance
- Loss of experienced employees and domain knowledge
- Delayed project completion
- Increased workload for remaining employees
- Difficulty in workforce planning

Most traditional HR systems focus on record management but do not provide predictive insights regarding employee turnover.

There is a need for an intelligent system capable of identifying employees who are likely to leave and helping organizations improve employee retention through proactive interventions.

---

# 🎯 Project Objectives

The primary objectives of this project are:

### Employee Attrition Prediction
Analyze employee-related data and identify employees at risk of leaving the organization.

### Workforce Retention
Provide actionable recommendations that help improve employee satisfaction and retention.

### HR Decision Support
Assist HR professionals in making informed decisions through analytics and reporting.

### Workforce Monitoring
Track attendance, leave behavior, performance ratings, and employee feedback.

### Business Intelligence
Generate visual dashboards and workforce insights for management.

---

# ✨ Key Features

## 🔐 Authentication & Authorization

- Secure user registration and login
- JWT-based authentication
- Password encryption using BCrypt
- Role-based access control
- Protected API endpoints
- Session security

### Supported Roles

#### HR Administrator
- Manage employees
- View analytics dashboards
- Monitor churn predictions
- Access retention recommendations
- Generate reports

#### Employee
- View personal profile
- Submit satisfaction surveys
- Access attendance history
- View performance records

---

## 👥 Employee Management

The Employee Management Module provides complete employee lifecycle management.

### Features

- Add new employees
- Edit employee information
- Delete employee records
- Search employees
- Filter employees by department
- View employee profiles
- Department and designation management

### Employee Information

- Employee ID
- Name
- Email
- Department
- Designation
- Joining Date
- Salary
- Manager Information

---

## 🕒 Attendance Management

Attendance records play a critical role in understanding employee engagement and work patterns.

### Features

- Daily attendance tracking
- Attendance history
- Monthly attendance reports
- Attendance percentage calculation
- Employee attendance analytics

### Benefits

Attendance trends help identify employees who may be disengaged or experiencing workplace dissatisfaction.

---

## 📅 Leave Management

The Leave Management Module tracks employee leave behavior and identifies unusual patterns.

### Features

- Leave record management
- Leave history tracking
- Leave frequency monitoring
- Leave trend analysis

### Benefits

Frequent or unusual leave patterns can indicate reduced employee engagement and contribute to churn prediction.

---

## 📈 Performance Management

The system stores and analyzes employee performance reviews.

### Features

- Performance ratings
- Review history
- Performance trend analysis
- Employee growth tracking

### Benefits

Consistently low performance ratings may indicate dissatisfaction, burnout, or disengagement.

---

## 😊 Employee Satisfaction Surveys

Employee feedback is one of the strongest indicators of potential attrition.

### Survey Parameters

- Work-Life Balance
- Salary Satisfaction
- Career Growth Opportunities
- Manager Support
- Workplace Environment
- Overall Job Satisfaction

### Benefits

Survey responses help organizations understand employee sentiment and improve workplace conditions.

---

# 🧠 Churn Prediction Engine

The Churn Prediction Engine is the core component of the application.

It evaluates employee behavior using predefined business rules and calculates a churn risk score ranging from 0 to 100.

---

## Factors Used for Prediction

### Attendance Percentage

Low attendance rates may indicate disengagement and increase attrition risk.

### Leave Frequency

Employees with unusually high leave frequency may have lower organizational commitment.

### Performance Ratings

Poor performance can indicate lack of motivation or workplace dissatisfaction.

### Overtime Hours

Excessive workload often contributes to employee burnout.

### Satisfaction Scores

Low satisfaction scores significantly increase churn probability.

---

## Risk Classification

| Score Range | Risk Level |
|------------|------------|
| 0 – 40 | 🟢 Low Risk |
| 41 – 70 | 🟡 Medium Risk |
| 71 – 100 | 🔴 High Risk |

---

## Example Risk Calculation

An employee with:

- Low attendance
- High overtime
- Low satisfaction score
- Poor performance rating

will receive a higher churn risk score and be classified as High Risk.

---

# 💡 Retention Recommendation Engine

Once a risk score is generated, the system automatically suggests retention actions.

### Examples

| Identified Issue | Recommendation |
|------------------|---------------|
| Excessive Overtime | Reduce Workload |
| Low Satisfaction | HR Counseling |
| Poor Performance | Training Program |
| Career Stagnation | Promotion Review |
| Frequent Leave | Employee Engagement Program |

These recommendations help HR departments take preventive measures before employee resignation occurs.

---

# 🚨 Alerts & Notifications

The system automatically generates alerts when:

- Churn score exceeds threshold
- Attendance percentage drops significantly
- Satisfaction scores decrease
- Performance ratings decline

This enables early intervention and proactive workforce management.

---

# 📊 Dashboard Analytics

The Analytics Dashboard provides visual insights into workforce health and employee behavior.

### Dashboard Metrics

- Total Employees
- Active Employees
- High-Risk Employees
- Average Satisfaction Score
- Attendance Statistics
- Department-Wise Distribution

### Visual Reports

- Churn Risk Distribution
- Attendance Trends
- Satisfaction Trends
- Performance Trends
- Department Analytics

The dashboard enables HR teams to monitor workforce conditions in real time.

---

# 🏗️ System Architecture

```text
                 Employee/User
                        │
                        ▼
              React Frontend (UI)
                        │
                        ▼
             Spring Boot REST APIs
                        │
                        ▼
              Business Logic Layer
                        │
                        ▼
               Churn Prediction Engine
                        │
                        ▼
                  MySQL Database
```

---

# 🛠️ Technology Stack

## Frontend

- React.js
- Vite
- Material UI
- React Router
- Axios
- Recharts

## Backend

- Java 21
- Spring Boot
- Spring Security
- JWT Authentication
- Hibernate
- Spring Data JPA

## Database

- MySQL

## Tools & Platforms

- Maven
- Docker
- Docker Compose
- Swagger/OpenAPI
- Git & GitHub

---

# 🗄️ Database Design

### Users
Stores login credentials and user roles.

### Employees
Stores employee profile information.

### Attendance
Stores daily attendance records.

### Leave Records
Stores employee leave history.

### Performance Reviews
Stores performance evaluations.

### Satisfaction Surveys
Stores employee feedback responses.

### Churn Predictions
Stores generated risk scores.

### Retention Recommendations
Stores suggested retention actions.

### Alerts
Stores system-generated notifications.

---

# 🚀 Installation & Setup

### Clone Repository

```bash
git clone https://github.com/your-username/employee-churn-prediction-system.git
```

### Navigate to Project Directory

```bash
cd employee-churn-prediction-system
```

### Run Application

```bash
docker-compose up
```

### Frontend

```bash
npm install
npm run dev
```

### Backend

```bash
mvn spring-boot:run
```

---

# 📂 Project Structure

```text
employee-churn-prediction-system/

├── frontend/
├── backend/
├── database/
├── docs/
├── docker/
├── screenshots/
├── README.md
└── docker-compose.yml
```

---

# 🔮 Future Enhancements

- Machine Learning-Based Churn Prediction
- AI-Powered Recommendation Engine
- Real-Time Notification Services
- Email & SMS Alerts
- Mobile Application Support
- Employee Sentiment Analysis
- Advanced Workforce Forecasting
- Predictive HR Analytics

---

# 🎓 Learning Outcomes

This project demonstrates practical knowledge in:

- Full-Stack Web Development
- Enterprise Software Architecture
- REST API Development
- Authentication & Authorization
- Database Design
- HR Analytics
- Data Visualization
- Software Engineering Principles
- Workforce Management Systems

---

# 👩‍💻 Author

### Saranya
Student, Cambridge Institute of Technology

Passionate about Software Engineering, Full-Stack Development, Data Analytics, and Building Real-World Solutions.

---

<div align="center">

### ⭐ If you found this project useful, consider starring the repository.

**Building Smarter Workplaces Through Data-Driven HR Analytics**

</div># Here are your Instructions
