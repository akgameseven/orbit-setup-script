# Orbit-Setup-Script L4 Level

These scripts will help you fund newly generated batch-poster and validator addresses, configure an Orbit chain, and deploy bridge contracts on both L3 and L4 chains.

---

## Prerequisites

1. **Node.js and Yarn**: Ensure you have Node.js (v16 or later) and Yarn installed on your system.
2. **Docker**: Docker must be installed and running on your machine.
3. **Private Key**: Have access to the private key of the wallet you will use to deploy the rollup contracts.

---

## Instructions

### 1. (Optional) Install L3
If you haven't already set up an L3 chain, follow the [Orbit Quickstart Guide](https://docs.arbitrum.io/launch-orbit-chain/orbit-quickstart) to deploy an L3 chain.

### 2. Deploy L4-L3 Smart Contracts
Deploy the necessary smart contracts for the L4-L3 bridge. You can refer to the [example L3-L2 contract on Sepolia](https://sepolia.arbiscan.io/address/0xd2ec8376b1df436fab18120e416d3f2bec61275b#code) for guidance.

### 3. Clone and Configure the Repository
Clone the [orbit-setup-script repository](https://github.com/akgameseven/orbit-setup-script) and install dependencies:
```bash
git clone https://github.com/akgameseven/orbit-setup-script.git  
cd orbit-setup-script  
yarn install
```

Move the `nodeConfig.json` and `orbitSetupScriptConfig.json` files into the `config` directory within the cloned repository.

### 4. Launch Docker Containers
Start the Docker containers to run the node and BlockScout explorer:
```bash
docker-compose up -d
```

- The node's public RPC will be available at `http://localhost:8449/`.
- The BlockScout explorer will be accessible at `http://localhost/`.

### 5. Run the Setup Script
Add the private key for the wallet used to deploy the rollup contracts and run the setup script:

```bash
PRIVATE_KEY="0xYourPrivateKey" L2_RPC_URL="<L3_NODE_RPC_URL>" L3_RPC_URL="http://localhost:8449" yarn run setup
```

- Replace `0xYourPrivateKey` with your actual private key.
- Replace `<L3_NODE_RPC_URL>` with the RPC URL of your L3 node.

### 6. Verify Deployment
Once the setup script completes, an `outputInfo.json` file will be generated in the root directory. This file contains all the details about the newly deployed Orbit chain.

### 7. (Optional) Monitor Logs
To track the logs of the running containers, use:
```bash
docker-compose logs -f nitro
```
---

## Refunding

Once you're done with your Orbit chain and want to refund any remaining balance from the batch poster and validator wallets, use the refund script:

```bash
PRIVATE_KEY="0xYourPrivateKey" L2_RPC_URL="<L3_NODE_RPC_URL>" TARGET_ADDRESS="0xYourTargetAddress" yarn run refund
```

- Replace `0xYourPrivateKey` with the private key of the wallet used to deploy the rollup contracts.
- Replace `<L3_NODE_RPC_URL>` with the RPC URL of your L3 node.
- Replace `0xYourTargetAddress` with the address where you want to receive the refunded funds.

---

## Notes
- Ensure your private key and RPC URLs are correctly configured to avoid deployment issues.
- The `outputInfo.json` file is critical for managing your Orbit chain. Keep it secure and accessible.
- For troubleshooting, refer to the logs using `docker-compose logs -f nitro`.