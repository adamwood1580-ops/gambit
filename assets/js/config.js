/*
 * GAMBIT PRESALE — EDIT THIS FILE FOR SITE CONFIGURATION
 * All values in a GitHub Pages repository are PUBLIC. Never put private keys,
 * recovery phrases, secret API keys or credentials here.
 *
 * The site ships in PREVIEW ONLY. Enabling a public offering requires legal
 * review, a separately deployed & audited presale contract, and appropriate
 * back-end compliance controls; a UI flag is not a compliance control.
 */
window.GAMBIT_CONFIG = Object.freeze({
  brand: {
    name: 'Gambit',
    symbol: 'GAM',
    contactEmail: '', // Optional public contact address, e.g. 'info@example.com'
    explorerTokenAddress: '' // Optional: deployed GAM token address
  },
  launch: {
    // Change to an ISO 8601 date WITH timezone, e.g. '2027-01-20T18:00:00Z'.
    // null = launch date not yet announced, so the countdown shows dashes.
    opensAt: null,
    // Do not imply an investment offer is available until legally approved.
    label: 'Launch date to be announced'
  },
  network: {
    // Testnet by default, for testing with worthless test BNB.
    chainId: 97,
    chainName: 'BNB Smart Chain Testnet',
    nativeCurrency: { name: 'Test BNB', symbol: 'tBNB', decimals: 18 },
    rpcUrls: ['https://bsc-testnet-dataseed.bnbchain.org'],
    blockExplorerUrls: ['https://testnet.bscscan.com']
    /* For BSC mainnet, use:
      chainId: 56,
      chainName: 'BNB Smart Chain',
      nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
      rpcUrls: ['https://bsc-dataseed.bnbchain.org'],
      blockExplorerUrls: ['https://bscscan.com']
    */
  },
  sale: {
    // The purchase flow expects a future, SEPARATE presale smart contract.
    // It does not send BNB to a personal wallet.
    contractAddress: '', // Deployed presale contract address (42-char 0x address)
    active: false, // Set true only after all independent conditions below are satisfied.
    legalSignoff: false, // Administrative publication switch, NOT regulatory enforcement.
    allowMainnet: false, // Explicit extra precaution for live-value transactions.
    priceUsd: 0.0001, // INDICATIVE only; on-chain contract fixes the price
    presaleAllocationGam: "10000000000000", // 10 trillion out of community 35%
    capUsdPerWallet: 1000, // on-chain enforced cumulative cap per address
    slippageBps: 100, // Maximum 1% difference from fresh on-chain quotation.
    minBNB: '0.001',
    maxBNB: '100', // bound on input only; $1000 cap is enforced on-chain
    // ABI expected by the web client:
    //   quoteTokens(uint256 bnbWei) view returns(uint256 gamRaw)
    //   isSaleOpen() view returns(bool)
    //   buyTokens(uint256 minGamRaw) payable
  },
  rates: {
    refreshMs: 60000,
    expiresMs: 180000,
    timeoutMs: 8000
  }
});
