# Spendly

A comprehensive expense tracking application with mobile and backend components.

## Project Structure

This is a monorepo containing:

- **Backend/** - Node.js API server with database integration
- **Mobile/** - React Native/Expo mobile application

## Quick Start

### Backend Setup
```bash
cd Backend
npm install
cp .env.example .env
# Configure your environment variables
npm run dev
```

### Mobile Setup
```bash
cd Mobile
npm install
npx expo start
```

## Features

- Expense tracking and categorization
- User authentication
- Data synchronization between mobile app and backend
- Real-time expense reporting
- Budget management

## API Documentation

See `Backend/API_DOCUMENTATION.md` for detailed API endpoints and usage.

## Architecture

For detailed architecture information, see:
- `Backend/ARCHITECTURE.md`
- `Backend/PROJECT_STRUCTURE.md`

## Development

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Expo CLI (for mobile development)
- Database (configured in backend)

### Environment Setup
1. Clone the repository
2. Set up backend environment variables from `.env.example`
3. Install dependencies in both directories
4. Start development servers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

[Add your license information here]

## Support

For issues and questions, please refer to the documentation in respective directories or create an issue in the repository.
