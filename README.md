<div align="center">

# 🚀 Employee Churn Prediction & Retention System

### Intelligent Workforce Analytics Platform for Predicting Employee Attrition and Improving Employee Retention

<p align="center">
A modern full-stack HR analytics solution that helps organizations identify employees at risk of leaving, monitor workforce health, and implement proactive retention strategies through data-driven insights.
</p>

### 🌐 Live Application

**🔗 Website:** https://hr-retention-1.preview.emergentagent.com/?utm_source=share

</div>

---

# 📖 Overview

Employee attrition is one of the most significant challenges faced by organizations today. Losing skilled employees not only increases recruitment and training costs but also impacts productivity, project continuity, and organizational growth.

The **Employee Churn Prediction & Retention System** is designed to assist Human Resource departments in identifying employees who may be at risk of leaving the organization. By analyzing attendance patterns, leave records, performance evaluations, overtime workload, and employee satisfaction levels, the system generates a churn risk score and provides actionable retention recommendations.

The platform enables organizations to move from reactive employee management to proactive workforce retention by offering real-time analytics, predictive insights, and decision-support tools.

---

# 🎯 Problem Statement

Organizations invest substantial resources in recruiting, training, and developing employees. However, unexpected employee turnover can lead to:

- Increased recruitment and onboarding expenses
- Reduced organizational productivity
- Delayed project delivery
- Loss of valuable knowledge and expertise
- Higher workload for existing employees
- Challenges in workforce planning

Traditional HR systems primarily focus on employee record management and often lack predictive capabilities. As a result, HR departments are unable to identify potential attrition risks before employees decide to leave.

This project addresses that challenge by providing an intelligent system capable of predicting employee churn and recommending appropriate retention strategies.

---

# 🎯 Project Objectives

The primary objectives of this system are:

- Predict employee attrition risks before resignation occurs.
- Improve employee retention through proactive intervention.
- Support HR professionals with data-driven decision-making.
- Monitor workforce engagement and satisfaction.
- Reduce hiring and training costs associated with employee turnover.
- Provide actionable workforce insights through analytics and reporting.

---

# ✨ Core Features

## 🔐 Authentication & Access Control

- Secure user registration and login
- JWT-based authentication
- Password encryption and secure credential management
- Role-based authorization
- Protected application routes
- Session security

### Supported User Roles

#### HR Administrator
- Manage employee records
- Access workforce analytics
- Monitor churn predictions
- View retention recommendations
- Analyze organizational trends

#### Employee
- Access personal profile
- View attendance records
- Review performance history
- Submit satisfaction surveys

---

## 👥 Employee Management

The Employee Management Module provides complete employee lifecycle management.

### Functionalities

- Add employee records
- Update employee information
- Delete employee records
- Search employees
- Filter employees by department
- Manage employee profiles
- Track department and designation information

### Employee Information Captured

- Employee ID
- Full Name
- Email Address
- Department
- Designation
- Joining Date
- Salary Information
- Reporting Manager

---

## 🕒 Attendance Management

Attendance behavior is an important indicator of employee engagement.

### Features

- Daily attendance tracking
- Attendance history management
- Attendance percentage calculation
- Monthly attendance reporting
- Workforce attendance analysis

### Benefits

The system helps identify employees with declining attendance patterns, which may indicate dissatisfaction or disengagement.

---

## 📅 Leave Management

The Leave Management Module monitors employee leave behavior and trends.

### Features

- Leave history management
- Leave frequency analysis
- Employee leave tracking
- Leave pattern monitoring

### Benefits

Unusual leave behavior may indicate reduced engagement or workplace concerns and can contribute to churn risk calculations.

---

## 📈 Performance Management

The system stores and evaluates employee performance records.

### Features

- Performance review tracking
- Employee rating management
- Historical performance analysis
- Productivity monitoring

### Benefits

Performance trends help HR teams understand employee growth, motivation, and engagement levels.

---

## 😊 Employee Satisfaction Surveys

Employee satisfaction is one of the strongest indicators of workforce stability.

### Survey Parameters

- Work-Life Balance
- Salary Satisfaction
- Career Growth Opportunities
- Managerial Support
- Workplace Environment
- Overall Job Satisfaction

### Benefits

Survey responses help organizations understand employee sentiment and improve workplace culture.

---

# 🧠 Churn Prediction Engine

The Churn Prediction Engine is the core component of the platform.

It analyzes multiple workforce indicators and calculates a churn risk score ranging from 0 to 100.

### Factors Used for Prediction

#### Attendance Percentage
Low attendance rates may indicate disengagement.

#### Leave Frequency
Frequent leave requests can suggest reduced commitment.

#### Performance Ratings
Declining performance may indicate dissatisfaction or burnout.

#### Overtime Hours
Excessive workload often increases attrition risk.

#### Satisfaction Scores
Low employee satisfaction significantly contributes to churn probability.

---

## Risk Classification

| Risk Score | Category |
|------------|----------|
| 0 – 40 | 🟢 Low Risk |
| 41 – 70 | 🟡 Medium Risk |
| 71 – 100 | 🔴 High Risk |

---

## Example Scenario

An employee who has:

- Low attendance
- Frequent leave records
- Poor performance ratings
- High overtime workload
- Low satisfaction survey scores

will receive a higher churn risk score and be classified as a High-Risk Employee.

---

# 💡 Retention Recommendation System

After risk evaluation, the platform automatically generates recommendations to help HR teams improve employee retention.

### Sample Recommendations

| Identified Issue | Suggested Action |
|------------------|------------------|
| Excessive Overtime | Reduce Workload |
| Low Satisfaction | HR Counseling |
| Poor Performance | Training Program |
| Career Stagnation | Promotion Review |
| Frequent Leave | Employee Engagement Activities |

These recommendations support proactive workforce management and help reduce employee turnover.

---

# 🚨 Alerts & Monitoring

The system automatically generates alerts when:

- Churn risk exceeds predefined thresholds
- Attendance percentage drops significantly
- Satisfaction scores decline
- Performance ratings decrease
- Employee engagement indicators become critical

This enables HR departments to intervene before attrition occurs.

---

# 📊 Analytics Dashboard

The Analytics Dashboard provides real-time workforce insights and visual reporting.

### Key Metrics

- Total Employees
- Active Employees
- High-Risk Employees
- Average Satisfaction Score
- Attendance Statistics
- Workforce Health Indicators

### Visual Analytics

- Churn Risk Distribution
- Attendance Trends
- Performance Trends
- Satisfaction Trends
- Department-Wise Employee Distribution
- Workforce Insights

The dashboard transforms raw HR data into meaningful business intelligence.

---

# 🏗️ System Architecture

```text
Employee/User
      │
      ▼
React Frontend
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

The architecture follows a modular and scalable design that separates presentation, business logic, and data layers for improved maintainability and performance.

---

# 🛠️ Technology Stack

## Frontend

- React.js
- Vite
- Material UI
- Axios
- React Router
- Recharts

## Backend

- Java 21
- Spring Boot
- Spring Security
- Spring Data JPA
- Hibernate
- JWT Authentication

## Database

- MySQL

## Development Tools

- Maven
- Docker
- Docker Compose
- Swagger/OpenAPI
- Git & GitHub

---

# 🗄️ Database Design

The application utilizes a relational database structure consisting of:

### Users
Stores authentication and role information.

### Employees
Stores employee profiles and organizational details.

### Attendance
Stores daily attendance records and work hours.

### Leave Records
Stores employee leave information.

### Performance Reviews
Stores employee performance ratings and reviews.

### Satisfaction Surveys
Stores employee feedback and survey responses.

### Churn Predictions
Stores risk scores and prediction history.

### Retention Recommendations
Stores generated retention strategies.

### Alerts
Stores system-generated notifications and warnings.

---

# 🎓 Academic & Technical Significance

This project demonstrates practical implementation of:

### Software Engineering
- Full-Stack Application Development
- Enterprise System Design
- Clean Architecture Principles
- Modular Development

### Database Systems
- Relational Database Design
- Entity Relationship Modeling
- Data Integrity Management

### Security
- Authentication & Authorization
- JWT Security Implementation
- Role-Based Access Control

### Analytics
- Workforce Analytics
- Business Intelligence Dashboards
- Data Visualization Techniques

### Human Resource Technology
- Employee Lifecycle Management
- Attrition Analysis
- Workforce Retention Strategies

---

# 🔮 Future Enhancements

The platform can be further enhanced through:

- Machine Learning-Based Attrition Prediction
- AI-Powered Retention Recommendations
- Real-Time Notification Services
- Email and SMS Alerts
- Mobile Application Development
- Employee Sentiment Analysis
- Advanced Predictive Analytics
- Workforce Forecasting Models

---

# 👩‍💻 Author

### Saranya

Cambridge Institute of Technology

Focused on building scalable software solutions, enterprise applications, and data-driven systems that solve real-world business problems.

---

<div align="center">

### ⭐ Building Smarter Workplaces Through Predictive HR Analytics

**Predict • Analyze • Retain**

</div>
