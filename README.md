# Zondax Migration Web Interface

---

![zondax_light](public/assets/zondax_light.png#gh-light-mode-only)
![zondax_dark](public/assets/zondax_dark.png#gh-dark-mode-only)

_Please visit our website at [zondax.ch](https://zondax.ch)_

---

# Polkadot Ledger Migration Tool

A comprehensive web application designed to streamline the migration process to the new Polkadot Universal Ledger App. This platform offers:

- **Elegant User Interface**: A modern, intuitive landing page that clearly explains the migration benefits
- **Step-by-Step Guidance**: An interactive assistant that walks users through each phase of the migration
- **Secure Transition**: Robust protocols ensuring safe transfer from legacy Ledger applications
- **Multi-Chain Support**: Seamless handling of various Substrate-based chains in one unified experience
- **Real-Time Progress Tracking**: Visual indicators showing migration status and completion

Built by Zondax to simplify the complex process of adopting the consolidated Universal Ledger App for the Polkadot ecosystem.

## :gear: Features

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

### Prerequisites

- Node.js (LTS version)
- pnpm (for package management)
- A Polkadot-compatible Ledger device (optional)

## 🧑‍💻 Getting Started

1. Clone the repository:

```bash
git clone [repository-url]
cd web-migration
```

2. Install dependencies:

```bash
pnpm install
```

3. Initialize your dev environment:

```bash
pnpm env:init
```

4. Start the development server:

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

## Development

### Available Scripts

- `pnpm dev` - Start development server with Turbo
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm test` - Run tests with coverage
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:e2e` - Run E2E tests with Playwright
- `pnpm test:e2e:debug` - Run E2E tests in debug mode
- `pnpm test:e2e:ui` - Run E2E tests with UI
- `pnpm test:e2e:report` - Show Playwright test report
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix ESLint issues
- `pnpm format` - Format code with Prettier and sort package.json
- `pnpm format:check` - Check code formatting
- `pnpm deps:update` - Update dependencies
- `pnpm env:init` - Initialize environment variables

### Project Structure

- `app/` - Next.js app router pages and layouts
- `components/` - Reusable React components
- `config/` - Application configuration
- `lib/` - Utility functions and shared libraries
- `public/` - Static assets
- `state/` - State management logic with legendapp/state

### Architecture

The application follows clean architecture principles:

- Business logic is separated from state management
- Services are agnostic of state management libraries
- Core business logic and interfaces are in separate files
- UI components are modular and composable

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Adding New Chains

This project provides a flexible configuration system for adding custom blockchain networks:

1. Add your chain logo to the `public/logos/chains` directory (the image filename must match the chain `id` you'll use in the configuration)
2. Add chain configuration in the `config/appsConfig.json` file with the following structure:
   ```json
   {
     "id": "your-chain-id",
     "name": "Your Chain Name",
     "cla": 123,
     "bip44Path": "m/44'/123'/0'/0'/0'",
     "ss58Prefix": 42,
     "rpcEndpoint": "wss://rpc.yourchain.network",
     "ticker": "SYMBOL",
     "decimals": 12
   }
   ```

Each chain configuration contains these key parameters:

- `id`: Unique identifier for the chain (must match the logo filename in the chains directory)
- `name`: Display name of the chain
- `cla`: Chain-specific class identifier
- `bip44Path`: The HD derivation path for the chain
- `ss58Prefix`: The SS58 address format prefix
- `rpcEndpoint`: WebSocket endpoint for connecting to the chain
- `ticker`: The currency symbol
- `decimals`: Number of decimal places for the currency

For detailed examples of how to structure your chain configuration, refer to the existing entries in the appsConfig.json file.

## License

This project is licensed under the Apache 2.0 License - see the LICENSE file for details.
