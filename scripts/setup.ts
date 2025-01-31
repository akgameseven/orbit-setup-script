import { ethers } from 'ethers'
import { L4Config } from './l4ConfigType'
import fs from 'fs'
import { ethOrERC20Deposit } from './nativeTokenDeposit'
import { createERC20Bridge } from './createTokenBridge'
import { l4Configuration } from './l4Configuration'
import { defaultRunTimeState, RuntimeState } from './runTimeState'
import { transferOwner } from './transferOwnership'
// Delay function
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function checkRuntimeStateIntegrity(rs: RuntimeState) {
  if (!rs.chainId) {
    rs.chainId = defaultRunTimeState.chainId
  }
  if (!rs.etherSent) {
    rs.etherSent = defaultRunTimeState.etherSent
  }
  if (!rs.nativeTokenDeposit) {
    rs.nativeTokenDeposit = defaultRunTimeState.nativeTokenDeposit
  }
  if (!rs.tokenBridgeDeployed) {
    rs.tokenBridgeDeployed = defaultRunTimeState.tokenBridgeDeployed
  }
  if (!rs.l4config) {
    rs.l4config = defaultRunTimeState.l4config
  }
  if (!rs.transferOwnership) {
    rs.transferOwnership = defaultRunTimeState.transferOwnership
  }
}

async function main() {
  // Read the environment variables
  const privateKey = process.env.PRIVATE_KEY
  const L2_RPC_URL = process.env.L2_RPC_URL
  const L4_RPC_URL = process.env.L4_RPC_URL

  if (!privateKey || !L2_RPC_URL || !L4_RPC_URL) {
    throw new Error('Required environment variable not found')
  }

  // Read the JSON configuration
  const configRaw = fs.readFileSync(
    './config/orbitSetupScriptConfig.json',
    'utf-8'
  )
  const config: L4Config = JSON.parse(configRaw)
  let rs: RuntimeState
  if (fs.existsSync('./config/resumeState.json')) {
    const stateRaw = fs.readFileSync('./config/resumeState.json', 'utf-8')
    rs = JSON.parse(stateRaw)
    //check integrity
    checkRuntimeStateIntegrity(rs)

    //check if there is a new chain config
    if (rs.chainId !== config.chainId) {
      rs = defaultRunTimeState
      console.log('A different chain config than last time was detected.')
    } else {
      console.log(
        'resumeState file found, will restart from where it failed last time.'
      )
    }
  } else {
    rs = defaultRunTimeState
  }

  rs.chainId = config.chainId
  // Generating providers from RPCs
  const L2Provider = new ethers.providers.JsonRpcProvider(L2_RPC_URL)
  const L4Provider = new ethers.providers.JsonRpcProvider(L4_RPC_URL)

  // Checking if the L2 network is the expected parent chain
  if ((await L2Provider.getNetwork()).chainId !== config.parentChainId) {
    throw new Error(
      'The L2 RPC URL you have provided is not for the correct parent chain'
    )
  }

  // Creating the signer
  const signer = new ethers.Wallet(privateKey).connect(L2Provider)

  try {
    ////////////////////////////////////////////////
    /// Funding batch-poster and staker address ///
    //////////////////////////////////////////////
    if (!rs.etherSent.batchPoster) {
      console.log('Funding batch-poster accounts on parent chain with 0.3 ETH')
      const tx1 = await signer.sendTransaction({
        to: config.batchPoster,
        value: ethers.utils.parseEther('0.3'),
      })
      console.log(`Transaction hash on parent chain: ${tx1.hash}`)
      const receipt1 = await tx1.wait()
      console.log(
        `Transaction was mined in block ${receipt1.blockNumber} on parent chain`
      )
      rs.etherSent.batchPoster = true
    }

    if (!rs.etherSent.staker) {
      console.log('Funding staker accounts on parent chain with 0.3 ETH')
      const tx2 = await signer.sendTransaction({
        to: config.staker,
        value: ethers.utils.parseEther('0.3'),
      })
      console.log(`Transaction hash on parent chain: ${tx2.hash}`)
      const receipt2 = await tx2.wait()
      console.log(
        `Transaction was mined in block ${receipt2.blockNumber} on parent chain`
      )
      rs.etherSent.staker = true
    }

    if (!rs.nativeTokenDeposit) {
      ////////////////////////////////////////////
      /// ETH/Native token deposit to L4 /////////
      ////////////////////////////////////////////
      console.log(
        'Running Orbit Chain Native token deposit to Deposit ETH or native ERC20 token from parent chain to your account on Orbit chain ... 💰💰💰💰💰💰'
      )
      const oldBalance = await L4Provider.getBalance(config.chainOwner)
      await ethOrERC20Deposit(privateKey, L2_RPC_URL)
      let depositCheckTime = 0

      // Waiting for 30 secs to be sure that ETH/Native token deposited is received on L4
      // Repeatedly check the balance until it changes by 0.4 native tokens
      while (true) {
        depositCheckTime++
        const newBalance = await L4Provider.getBalance(config.chainOwner)
        if (newBalance.sub(oldBalance).gte(ethers.utils.parseEther('0.4'))) {
          console.log(
            'Balance of your account on Orbit chain increased by the native token you have just sent.'
          )
          break
        }
        let tooLongNotification = ''
        if (depositCheckTime >= 6) {
          tooLongNotification =
            "(It is taking a long time. Did you change the config files? If you did, you will need to delete ./config/My Arbitrum L4 Chain, since this chain data is for your last config file. If you didn't change the file, please ignore this message.)"
        }
        console.log(
          `Balance not changed yet. Waiting for another 30 seconds ⏰⏰⏰⏰⏰⏰ ${tooLongNotification}`
        )
        await delay(30 * 1000)
      }
      rs.nativeTokenDeposit = true
    }

    if (!rs.tokenBridgeDeployed) {
      ////////////////////////////////
      /// Token Bridge Deployment ///
      //////////////////////////////
      console.log(
        'Running tokenBridgeDeployment or erc20TokenBridge script to deploy token bridge contracts on parent chain and your Orbit chain 🌉🌉🌉🌉🌉'
      )
      await createERC20Bridge(L2_RPC_URL, privateKey, L4_RPC_URL, config.rollup)
      rs.tokenBridgeDeployed = true
    }
    ////////////////////////////////
    /// L4 Chain Configuration ///
    //////////////////////////////
    if (!rs.l4config) {
      console.log(
        'Running l4Configuration script to configure your Orbit chain 📝📝📝📝📝'
      )
      await l4Configuration(privateKey, L2_RPC_URL, L4_RPC_URL)
      rs.l4config = true
    }
    ////////////////////////////////
    /// Transfering ownership /////
    //////////////////////////////
    if (!rs.transferOwnership) {
      console.log(
        'Transferring ownership on L4, from rollup owner to upgrade executor 🔃🔃🔃'
      )
      await transferOwner(privateKey, L2Provider, L4Provider)
      rs.transferOwnership = true
    }
  } catch (error) {
    console.error('Error occurred:', error)
    const runtimeString = JSON.stringify(rs)
    fs.writeFileSync('./config/resumeState.json', runtimeString)
    console.log(
      "Seems something went wrong during this process, but don't worry, we have recorded the deployed and initialized contracts into ./config/resumeState.json, next time you rerun the script, it will restart from where it failed "
    )
  }
}

// Run the script
main().catch(error => {
  console.error(error)
  process.exit(1)
})
