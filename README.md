# StockMaster

A full-stack Inventory Management System (IMS) built with Node.js, Express, MongoDB, and React.

## Features

- **User Management**: Role-based access (INVENTORY_MANAGER, WAREHOUSE_STAFF)
- **Authentication**: JWT-based auth with OTP password reset
- **Product Management**: SKU-based product catalog with categories
- **Warehouse & Location Management**: Multi-warehouse support with location types
- **Stock Operations**: Receipts, Deliveries, Internal Transfers, Adjustments
- **Stock Tracking**: Real-time stock levels per location
- **Reorder Rules**: Automated low stock detection
- **Dashboard**: Key metrics and reporting
- **Audit Trail**: Complete move history and stock ledger

## Tech Stack

### Backend
- **Runtime**: Node.js (LTS)
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT + bcrypt

### Frontend
- **Framework**: React.js
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **HTTP Client**: Axios
- **Charts**: Recharts

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (MongoDB Atlas URI)
- npm

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd StockMaster
```

### 2. Backend Setup

Navigate to the server directory:

```bash
cd server
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the `server/` directory:

```env
PORT=3000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string_here
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
OTP_EXPIRY_MINUTES=10
```

**Important**: Replace `your_mongodb_connection_string_here` with your actual MongoDB connection URI. If you're using MongoDB Atlas, the URI will look like:
```
mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority
```

### 3. Frontend Setup

Open a new terminal and navigate to the client directory:

```bash
cd client
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the `client/` directory:

```env
VITE_API_URL=http://localhost:3000
VITE_USE_MOCK_API=false
```

## Running the Project

### Running the Backend

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

   The backend server will start on `http://localhost:3000`

3. You should see:
   ```
   ✅ MongoDB Connected: ...
   📊 Database: ...
   🚀 StockMaster API server running on port 3000
   📊 Environment: development
   🔗 Health check: http://localhost:3000/health
   ```

### Running the Frontend

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will start on `http://localhost:5173` (or another port if 5173 is occupied)

3. Open your browser and navigate to the URL shown in the terminal (typically `http://localhost:5173`)

## Project Structure

```
StockMaster/
├── server/                 # Backend server
│   ├── src/
│   │   ├── modules/       # Feature modules (auth, products, etc.)
│   │   ├── middleware/    # Express middleware
│   │   ├── utils/         # Utility functions
│   │   ├── config/        # Configuration files
│   │   ├── app.js         # Express app setup
│   │   └── server.js      # Server entry point
│   ├── package.json
│   └── .env              # Environment variables (create this)
│
└── client/                # Frontend React app
    ├── src/
    │   ├── api/          # API service functions
    │   ├── components/   # React components
    │   ├── features/     # Feature-based pages
    │   ├── contexts/     # React contexts
    │   ├── routes/       # Route definitions
    │   └── services/     # Service layer
    ├── package.json
    └── .env             # Environment variables (create this)
```

## Environment Variables

### Backend (.env in `server/` directory)

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port number | No (default: 3000) |
| `NODE_ENV` | Environment (development/production) | No (default: development) |
| `MONGO_URI` | MongoDB connection string | **Yes** |
| `JWT_SECRET` | Secret key for JWT tokens | **Yes** |
| `JWT_EXPIRES_IN` | JWT token expiration time | No (default: 7d) |
| `OTP_EXPIRY_MINUTES` | OTP expiration time in minutes | No (default: 10) |

### Frontend (.env in `client/` directory)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | **Yes** |
| `VITE_USE_MOCK_API` | Use mock API instead of real backend | No (default: false) |

## API Endpoints

The backend API is available at `http://localhost:3000`. Key endpoints include:

- `GET /health` - Health check endpoint
- `/auth` - Authentication endpoints (login, signup, etc.)
- `/products` - Product management
- `/warehouses` - Warehouse management
- `/categories` - Category management
- `/documents` - Document management
- `/dashboard` - Dashboard metrics

## Troubleshooting

### Backend Issues

1. **MongoDB Connection Error**: 
   - Verify your `MONGO_URI` in the `.env` file is correct
   - Check if MongoDB Atlas whitelist includes your IP address (if using Atlas)
   - Ensure MongoDB service is running (if using local MongoDB)

2. **Port Already in Use**:
   - Change the `PORT` in `.env` or kill the process using port 3000

### Frontend Issues

1. **Cannot Connect to API**:
   - Ensure backend is running on port 3000
   - Check `VITE_API_URL` in client `.env` file
   - Verify CORS is enabled in backend

2. **Module Not Found Errors**:
   - Run `npm install` in the client directory
   - Delete `node_modules` and reinstall if issues persist

## Development

### Backend Development

```bash
cd server
npm run dev    # Start with nodemon (auto-reload on changes)
npm start      # Start production server
```

### Frontend Development

```bash
cd client
npm run dev    # Start Vite dev server
npm run build  # Build for production
npm run preview # Preview production build
```

## License

ISC
