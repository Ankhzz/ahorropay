export const MAINNET_ADDRESS = "0x0000000000000000000000000000000000000000";
export const SEPOLIA_ADDRESS = "0xf05B512BaB229ACD7B2C3eE422Eb5f517A9fa929";
export const SEPOLIA_CHAIN_ID = 11142220;
export const MOCK_USDM_SEPOLIA = "0xcd81E384E84B7EDd427E872b922A8C095E058B36";
export const USDM_ADDRESS = "0x765DE816845861e75A25fCA122bb6898B8B1282a";

export function getAhorroPayAddress(chainId: number): `0x${string}` {
  return (chainId === SEPOLIA_CHAIN_ID ? SEPOLIA_ADDRESS : MAINNET_ADDRESS) as `0x${string}`;
}

export const AHORROPAY_ABI = [
  { type: "constructor", inputs: [{ name: "_cUSD", type: "address", internalType: "address" }], stateMutability: "nonpayable" },
  { type: "function", name: "cUSD", inputs: [], outputs: [{ name: "", type: "address", internalType: "contract IERC20" }], stateMutability: "view" },
  { type: "function", name: "circles", inputs: [{ name: "", type: "uint256" }], outputs: [
    { name: "creator", type: "address" }, { name: "amountPerRound", type: "uint256" },
    { name: "duration", type: "uint256" }, { name: "maxMembers", type: "uint256" },
    { name: "memberCount", type: "uint256" }, { name: "currentRound", type: "uint256" },
    { name: "startTime", type: "uint256" }, { name: "currentReceiver", type: "address" },
    { name: "state", type: "uint256" }
  ], stateMutability: "view" },
  { type: "function", name: "claimPayout", inputs: [{ name: "circleId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "contribute", inputs: [{ name: "circleId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "createCircle", inputs: [
    { name: "amountPerRound", type: "uint96" }, { name: "duration", type: "uint32" }, { name: "maxMembers", type: "uint8" }
  ], outputs: [{ name: "circleId", type: "uint256" }], stateMutability: "nonpayable" },
  { type: "function", name: "dispute", inputs: [{ name: "circleId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "getCircle", inputs: [{ name: "circleId", type: "uint256" }], outputs: [
    { name: "creator", type: "address" }, { name: "amountPerRound", type: "uint256" },
    { name: "duration", type: "uint256" }, { name: "maxMembers", type: "uint256" },
    { name: "memberCount", type: "uint256" }, { name: "currentRound", type: "uint256" },
    { name: "startTime", type: "uint256" }, { name: "currentReceiver", type: "address" },
    { name: "state", type: "uint256" }, { name: "memberList", type: "address[]" }
  ], stateMutability: "view" },
  { type: "function", name: "getCircleCount", inputs: [], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "getCirclesByHolder", inputs: [{ name: "holder", type: "address" }], outputs: [{ name: "", type: "uint256[]" }], stateMutability: "view" },
  { type: "function", name: "joinCircle", inputs: [{ name: "circleId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "resolveDispute", inputs: [{ name: "circleId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "startCircle", inputs: [{ name: "circleId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "event", name: "CircleCreated", inputs: [
    { name: "circleId", type: "uint256", indexed: true }, { name: "creator", type: "address", indexed: true },
    { name: "amount", type: "uint256", indexed: false }, { name: "maxMembers", type: "uint8", indexed: false }
  ], anonymous: false },
  { type: "event", name: "MemberJoined", inputs: [
    { name: "circleId", type: "uint256", indexed: true }, { name: "member", type: "address", indexed: true }
  ], anonymous: false },
  { type: "event", name: "CircleStarted", inputs: [{ name: "circleId", type: "uint256", indexed: true }], anonymous: false },
  { type: "event", name: "ContributionMade", inputs: [
    { name: "circleId", type: "uint256", indexed: true }, { name: "round", type: "uint256", indexed: true },
    { name: "member", type: "address", indexed: true }
  ], anonymous: false },
  { type: "event", name: "PayoutClaimed", inputs: [
    { name: "circleId", type: "uint256", indexed: true }, { name: "round", type: "uint256", indexed: true },
    { name: "receiver", type: "address", indexed: true }
  ], anonymous: false },
] as const;

export const MOCK_USDM_ABI = [
  {
    type: "function",
    name: "mint",
    inputs: [
      { name: "to", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
] as const;