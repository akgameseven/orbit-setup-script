# orbit-setup-script L4 level

> [!CAUTION]
> **This repository and the scripts within are not meant for production use!**
 
These scripts will help you fund newly generated batch-poster and validator addresses, configure an Orbit chain, and deploy bridge contracts on both L3 and L4 chains.

## Instructions

1. (Optional) Install L3 https://docs.arbitrum.io/launch-orbit-chain/orbit-quickstart
2. Deploy L4-L3 smart contracts. L3-L2 example here: https://sepolia.arbiscan.io/address/0xd2ec8376b1df436fab18120e416d3f2bec61275b#code
3. Clone the https://github.com/akgameseven/orbit-setup-script repository, and run `yarn install`. Then, move both the `nodeConfig.json` and `orbitSetupScriptConfig.json` files into the `config` directory within the cloned repository
4. Launch Docker, and in the base directory, run `docker-compose up -d`. This will launch the node with a public RPC reachable at http://localhost:8449/ and a corresponding BlockScout explorer instance, viewable at http://localhost/
5. Then, add the private key for the wallet you used to deploy the rollup contracts earlier in the following command, and run it: `PRIVATE_KEY="0xYourPrivateKey" L2_RPC_URL="<L3_NODE_RPC_URL>" L3_RPC_URL="http://localhost:8449" yarn run setup`
6. The Orbit chain is now up. You can find all information about the newly deployed chain in the `outputInfo.json` file which is created in the main directory of script folder
7. Optionally, to track logs, run the following command within the base directory: `docker-compose logs -f nitro`

## Refunding

Once you're done with your Orbit chain and want to refund any remaining balance from the batch poster and validator wallets, you can use the refund script by running: `PRIVATE_KEY="0xYourPrivateKey" L2_RPC_URL="<L3_NODE_RPC_URL>" TARGET_ADDRESS="0xYourTargetAddress" yarn run refund`

> [!NOTE]
> Make sure to replace "0xYourPrivateKey" with the private key of the wallet you used to deploy the rollup contracts, and "0xYourTargetAddress" with the address where you want to receive the refunded funds.

This will transfer any remaining balance from the batch poster and validator wallets to the specified target address.
