export interface RuntimeState {
  chainId: number
  etherSent: EtherSent
  nativeTokenDeposit: boolean
  tokenBridgeDeployed: boolean
  l4config: boolean
  transferOwnership: boolean
}

interface EtherSent {
  batchPoster: boolean
  staker: boolean
}

export const defaultRunTimeState: RuntimeState = {
  chainId: 0,
  etherSent: {
    batchPoster: false,
    staker: false,
  },
  nativeTokenDeposit: false,
  tokenBridgeDeployed: false,
  l4config: false,
  transferOwnership: false,
}
