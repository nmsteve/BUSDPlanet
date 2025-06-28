# BUSDPlanet

BUSDPlanet is a smart contract project designed to facilitate token transactions and dividend distribution on the Binance Smart Chain (BSC). It includes features such as liquidity management, fee distribution, and dividend tracking.

## Features
- **Total Supply Management**: Ensures the total supply matches the configured value.
- **Fee Handling**: Supports transactions with wallets excluded or not excluded from fees.
- **Liquidity Addition**: Allows adding liquidity seamlessly.
- **Fee Distribution**: Sends fees to designated wallets accurately.
- **Swap and Liquify**: Automates the process of swapping tokens and adding liquidity.

## Testing
To test the functionality of the BUSDPlanet smart contract, follow these steps:

1. Verify that the total supply matches the configured value.
2. Test token transfers to wallets excluded and not excluded from fees.
3. Ensure liquidity addition works as expected.
4. Check that fees are distributed to the appropriate wallets.
5. Confirm that the swap and liquify mechanism operates correctly.

## Slither Configuration
Slither is a static analysis tool for smart contracts. Below is the configuration used for this project:

```json
{
    "detectors_to_run": "",
    "filter_paths": "contracts/mocks"
}
```

## Deployment
To deploy the BUSDPlanet smart contract, use the `deploy.js` script located in the `scripts/` directory. Ensure you have Hardhat installed and configured.

## Directory Structure
- **contracts/**: Contains the smart contract files.
- **scripts/**: Includes deployment scripts.
- **test/**: Contains test scripts for validating contract functionality.

## Prerequisites
- Node.js
- Hardhat
- Slither

## Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

## Usage
Run tests to validate the contract:
```bash
npx hardhat test
```

Analyze the contract using Slither:
```bash
slither .
```