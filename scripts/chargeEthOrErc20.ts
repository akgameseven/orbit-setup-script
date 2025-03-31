import { ethers } from 'ethers'
import { ERC20__factory } from '@arbitrum/sdk/dist/lib/abi/factories/ERC20__factory'
import fs from 'fs'

// Delay function
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Read the JSON configuration
const configRaw = fs.readFileSync(
  './config/orbitSetupScriptConfig.json',
  'utf-8'
)
const config = JSON.parse(configRaw)
const ERC20InboxAddress = config.inbox

const erc20InboxInterface = new ethers.utils.Interface([
  'function depositERC20(uint256) public returns (uint256)',
])

async function main() {
  const privateKey = process.env.PRIVATE_KEY
  const L3_RPC_URL = process.env.L3_RPC_URL
  const L4_RPC_URL = process.env.L4_RPC_URL
  const amount = process.env.AMOUNT

  if (!privateKey || !L3_RPC_URL || !L4_RPC_URL || !amount) {
    throw new Error('Required environment variable not found')
  }

  const l3Provider = new ethers.providers.JsonRpcProvider(L3_RPC_URL)
  const l4Provider = new ethers.providers.JsonRpcProvider(L4_RPC_URL)
  const l3Signer = new ethers.Wallet(privateKey).connect(l3Provider)

  const erc20Inbox = new ethers.Contract(
    ERC20InboxAddress,
    erc20InboxInterface,
    l3Signer
  )

  const configRaw = fs.readFileSync(
    './config/orbitSetupScriptConfig.json',
    'utf-8'
  )
  const config = JSON.parse(configRaw)
  const nativeToken = config.nativeToken
  const oldBalance = await l4Provider.getBalance(config.chainOwner)
  let tx
  if (nativeToken === ethers.constants.AddressZero) {
    const inboxAddress = config.inbox
    const depositEthInterface = new ethers.utils.Interface([
      'function depositEth() public payable',
    ])
    // create contract instance
    const contract = new ethers.Contract(
      inboxAddress,
      depositEthInterface,
      l3Signer
    )
    // deposit 0.4 ETH
    const tx = await contract.depositEth({
      value: ethers.utils.parseEther('0.4'),
    })
    console.log('Transaction hash on parent chain: ', tx.hash)
    await tx.wait()
    console.log('Transaction has been mined')
    console.log('0.4 ETHs are deposited to your account')
  } else {
    const nativeTokenContract = ERC20__factory.connect(nativeToken, l3Provider)
    const decimals = await nativeTokenContract.decimals()
    if (decimals !== 18) {
      throw new Error('We currently only support 18 decimals token')
    }
    tx = await erc20Inbox.depositERC20(
      ethers.utils.parseUnits(amount, decimals)
    )
    console.log('Transaction hash on parent chain: ', tx.hash)
    await tx.wait()
    console.log('Transaction has been mined')
    console.log(amount + ' native tokens are deposited to your account')
  }

  while (true) {
    const newBalance = await l4Provider.getBalance(config.chainOwner)
    if (newBalance.gt(oldBalance)) {
      console.log(
        `LFG! 🚀 Balance of your account on Orbit chain increased by ${amount} Ether.`
      )
      break
    }
    console.log(
      'Balance not changed yet. Waiting for another 30 seconds to receive the funds on the Orbit chain ⏰⏰⏰⏰⏰⏰'
    )
    await delay(30 * 1000)
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
