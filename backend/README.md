# Backend API for Gym Management DApp

This backend provides REST API endpoints for interacting with the GymManager smart contract on Ethereum.

## Quick Start

1. **Setup environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

2. **Run setup check:**
   ```bash
   npm run setup
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start the server:**
   ```bash
   npm start          # Production
   npm run dev        # Development with auto-reload
   ```

## Docker Development

```bash
# Start with local Hardhat node
docker-compose up

# Or build and run manually
docker build -t gym-backend .
docker run -p 3001:3001 --env-file .env gym-backend
```

## Testing

```bash
npm test           # Run tests once
npm run test:watch # Run tests in watch mode
```

## Project Structure

```
backend/
├── config/           # Configuration management
├── controllers/      # Request handlers
├── middleware/       # Express middleware
│   ├── rateLimit.js  # Rate limiting
│   └── validate.js   # Input validation
├── routes/           # API routes
├── services/         # Business logic & blockchain integration
├── utils/            # Shared utilities
│   ├── cache.js      # In-memory caching
│   ├── errors.js     # Custom error classes
│   └── logger.js     # Logging utility
├── tests/            # API integration tests
├── scripts/          # Setup and utility scripts
├── abi/              # Smart contract ABI
├── Dockerfile        # Container configuration
├── docker-compose.yml # Local development setup
├── package.json      # Dependencies and scripts
├── server.js         # Application entry point
└── README.md         # This file
```

## API Endpoints

### Public Endpoints

- `GET /api/fee` - Get current membership fee
- `GET /api/member/:address` - Get member status by address
- `GET /api/members` - Get all members

### Admin Endpoints (requires owner wallet)

- `GET /api/admin/balance` - Get contract ETH balance
- `GET /api/admin/events` - Get all contract events
- `POST /api/admin/withdraw` - Withdraw ETH from contract
- `POST /api/admin/set-fee` - Update membership fee
- `POST /api/admin/renew` - Renew membership for a member

### Health Check

- `GET /health` - Server and contract health status

## Security Features

- **Rate Limiting**: Different limits for public/admin endpoints
- **Input Validation**: Address and fee validation
- **Error Handling**: Structured error responses
- **CORS**: Cross-origin resource sharing enabled

## Configuration

All configuration is centralized in `config/index.js`. Environment variables:

- `RPC_URL`: Ethereum RPC endpoint
- `PRIVATE_KEY`: Private key of the contract owner
- `CONTRACT_ADDRESS`: Deployed GymManager contract address
- `PORT`: Server port (default 3001)
- `LOG_LEVEL`: Logging level (error, warn, info, debug)

- `GET /health` - Server and contract health status

## Architecture

- **controllers/**: Business logic handlers
- **routes/**: API route definitions
- **services/**: Contract interaction and event watching
- **middleware/**: Validation and error handling
- **utils/**: Shared utilities (cache, logger, errors)