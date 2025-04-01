# Zondax Web Migration

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

## :gear: Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org) (App Router)
- **State Management**: [@legendapp/state](https://legendapp.com/state/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com) + [class-variance-authority](https://cva.style/docs)
- **Components**: [Radix UI](https://www.radix-ui.com/) + [Shadcn UI](https://ui.shadcn.com/)
- **Blockchain**: [@polkadot/api](https://polkadot.js.org/docs/api)
- **Hardware Wallet**: Ledger integration via [@zondax/ledger-substrate](https://github.com/Zondax/ledger-substrate-js)
- **Animation**: [Framer Motion](https://www.framer.com/motion/)
- **Development**: TypeScript, Prettier
- **Deployment**: Vercel

## 🧑‍💻 Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   yarn install
   ```
3. Initialize your dev environment:
   ```bash
   yarn dev:init
   ```
4. Start the development server:
   ```bash
   yarn dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `app/` - Next.js app router pages and layouts
- `components/` - Reusable React components
- `config/` - Application configuration
- `lib/` - Utility functions and shared libraries
- `public/` - Static assets
- `state/` - State management logic with legendapp/state

## Architecture

The application follows clean architecture principles:

- Business logic is separated from state management
- Services are agnostic of state management libraries
- Core business logic and interfaces are in separate files
- UI components are modular and composable

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

## Development Guidelines

- When adding new features, create modular components in dedicated files
- Extract reusable UI elements into configurable components
- Use hooks to encapsulate complex logic and state management
- Keep state management centralized in parent components
- Follow the established styling patterns using Tailwind CSS

## License

See [LICENSE.md](LICENSE.md) for details.
