# Chain Logos

This directory contains logo images for blockchain networks supported by the application.

## Naming Convention

Each logo file should follow this naming pattern:
- Filename: `{chain-id}.png`
- The `chain-id` must match the `id` field in the chain configuration defined in `config/appsConfig.json`

## Image Requirements

- Format: PNG with transparency
- Recommended size: 128x128 pixels
- Maximum file size: 50KB

## Usage

The application will first check for local images in this directory before making API requests to fetch logos, improving performance and reducing network calls.

## Adding New Chain Logos

1. Add your chain logo to this directory using the naming convention described above
2. Ensure the image meets the recommended requirements
3. Reference your chain in the configuration file with matching ID 