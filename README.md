# Polkadot Migration Web Interface

A modern web interface for Polkadot migration built with Next.js 15 and React 19.

## Features

- **Modern Stack**

  - Next.js 15 with App Router
  - React 19
  - TypeScript
  - Tailwind CSS
  - Shadcn UI Components
  - Vercel Analytics

- **Polkadot Integration**

  - Ledger Hardware Wallet Support
  - Polkadot API Integration
  - Substrate Protocol Support

- **Development Tools**
  - ESLint for code linting
  - Prettier for code formatting
  - Vitest for testing
  - Playwright for E2E testing

## Getting Started

### Prerequisites

- Node.js (LTS version)
- Bun (for package management)
- A Polkadot-compatible Ledger device (optional)

### Installation

1. Clone the repository:

```bash
git clone [repository-url]
cd web-migration
```

2. Install dependencies:

```bash
bun install
```

3. Copy the environment variables:

```bash
cp .env.example .env
```

4. Start the development server:

```bash
bun dev
```

The application will be available at `http://localhost:3000`.

## Development

### Available Scripts

- `bun dev` - Start development server
- `bun build` - Build for production
- `bun start` - Start production server
- `bun test` - Run tests
- `bun test:watch` - Run tests in watch mode
- `bun lint` - Run ESLint
- `bun format` - Format code with Prettier
- `bun deps:update` - Update dependencies

### Project Structure

- `app/` - Next.js app router pages and layouts
- `components/` - Reusable React components
- `config/` - Application configuration
- `lib/` - Utility functions and shared logic
- `state/` - State management
- `public/` - Static assets

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the Apache 2.0 License - see the LICENSE file for details.
