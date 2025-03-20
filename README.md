# Unified Event Analytics Engine

## Overview
The Unified Event Analytics Engine is a robust system designed to collect, process, and analyze event data from various applications. The architecture follows modern best practices for scalability, security, and maintainability.

## Features
- **Event Collection**: Collects analytics data for various events.
- **User Authentication**: Supports OAuth 2.0 with Google and API key-based authentication.
- **API Documentation**: Auto-generated API documentation using OpenAPI/Swagger.
- **Rate Limiting**: Prevents abuse through request limiting.
- **Input Validation**: Comprehensive validation using express-validator.
- **Scalability**: Stateless API design enables horizontal scaling.

## Prerequisites
- Docker
- Docker Compose

## Getting Started

### Clone the Repository
```sh
git clone https://github.com/harsh-haria/unified-event-analytics-engine.git
cd unified-event-analytics-engine
```

### Environment Variables
Create a `.env` file in the root directory and add the following environment variables:
```properties
PORT=3090
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3090/api/auth/google/callback
SESSION_SECRET=your_session_secret
API_EXPIRATION_DAYS=30
NODE_ENV=development

DB_HOST=db
DB_PORT=3306
DB_USER=dbadmin
DB_PASSWORD=dbadmin
DB_NAME=events_engine
```

### Docker Setup
Ensure Docker and Docker Compose are installed on your machine.

### Build and Run the Containers (will spin up MySql Server)
```sh
docker-compose -f docker-compose.yaml up --build
```

### Access the Application
- The Node.js application will be available at `http://localhost:3090`
- The MySQL database will be available at `localhost:3306`

## API Endpoints

### Collect Analytics Data
- **Endpoint**: `/api/analytics/collect`
- **Method**: POST
- **Description**: Collects analytics data for events and stores them in the database.
- **Security**: API key-based authentication

### Retrieve Event Summary
- **Endpoint**: `/api/analytics/event-summary`
- **Method**: GET
- **Description**: Fetches a summary of an event including unique users and device breakdown.
- **Security**: API key-based authentication

### Retrieve User Statistics
- **Endpoint**: `/api/analytics/user-stats`
- **Method**: GET
- **Description**: Fetches event statistics for a given user, including total events, last device details, and IP address.
- **Security**: API key-based authentication

## Architecture

### Backend Framework
- **Express.js**: Used as the primary Node.js framework to handle HTTP requests, routing, and middleware implementation.

### Authentication & Authorization
- **OAuth 2.0 with Google**: Via Passport.js
- **API key-based authentication**: For service-to-service communication
- **Session management**: Express-session for maintaining user sessions

### API Design
- **RESTful API principles**: Clear resource naming, appropriate HTTP methods
- **OpenAPI/Swagger documentation**: Auto-generated API documentation

### Security Measures
- **Middleware approach**:
  - ValidateApiKey: Validates API keys for programmatic access
  - ValidateUser: Ensures users have proper permissions
  - RateLimiter: Prevents abuse through request limiting
- **Input validation**: Comprehensive validation using express-validator

### Data Architecture
- **Model layer**: Separation of data access logic (EventModel, KeysModel)

### Middleware Organization
- **Feature-specific middleware files**:
  - collect-validations.js
  - event-summary-validations.js
  - auth.js
  - rate-limiter.js

### Error Handling & Validation
- **Express-validator**: Structured validation for all inputs
- **Consistent error responses**: Standardized error format

### Scalability Considerations
- **Stateless API design**: Enables horizontal scaling
- **Rate limiting**: Protects against traffic spikes

### Endpoints Organization
- **Hierarchical routing**: Main router delegates to feature-specific routes

### Configuration Management
- **Environment variables**: Using dotenv for configuration

## Future Architecture Considerations
- Add caching layer for frequently accessed analytics
- Consider message queues for handling high traffic loads
- Add support for custom event definitions
- For very high write heavy systems, implement master-slave architecture for the database

## License
This project is licensed under the MIT License.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request.

## Contact
For any inquiries, please contact [harsh.nh2412@gmail.com].