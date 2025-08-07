# Kasmoni - Payment Management System

A comprehensive payment management system with frontend and backend components.

## Project Structure

```
kasmoni/
├── backend/          # Node.js/Express backend
├── frontend/         # React TypeScript frontend
└── package.json      # Root package.json
```

## Features

- **Payment Management**: Track and manage payments
- **Member Management**: Add and manage members
- **Group Management**: Organize payments by groups
- **Analytics**: Payment analytics and reporting
- **Bank Integration**: Bank account management
- **Message System**: Internal messaging system
- **Payment Requests**: Request and approve payments
- **Archived Payments**: Historical payment records
- **User Logs**: Activity tracking

## Tech Stack

### Backend
- Node.js with TypeScript
- Express.js
- SQLite database
- JWT authentication

### Frontend
- React with TypeScript
- Modern UI components
- Responsive design

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd kasmoni
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Set up the database**
   ```bash
   cd backend
   npm run migrate
   ```

4. **Start the development servers**
   ```bash
   # Start backend (from backend directory)
   npm run dev
   
   # Start frontend (from frontend directory)
   npm start
   ```

## Development

### Backend Development
- Located in `backend/` directory
- Uses TypeScript
- SQLite database
- RESTful API endpoints

### Frontend Development
- Located in `frontend/` directory
- React with TypeScript
- Modern component architecture

## Scripts

### Root Level
- `npm install`: Install all dependencies

### Backend
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm start`: Start production server
- `npm run migrate`: Run database migrations

### Frontend
- `npm start`: Start development server
- `npm run build`: Build for production
- `npm test`: Run tests

## Environment Variables

Create `.env` files in the backend directory with the following variables:

```
PORT=3001
JWT_SECRET=your-secret-key
DATABASE_URL=./database/kasmoni.db
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is private and proprietary.

## Support

For support and questions, please contact the development team. 