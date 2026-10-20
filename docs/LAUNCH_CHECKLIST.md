# GAM Website — Deployment Readiness Checklist

## Preview website (safe starting state)
- [x] Editable UTC countdown date (currently **not configured**)
- [x] Wallet connect (EIP-1193 / EIP-6963) + MetaMask mobile deep link
- [x] BNB/USD live indicative converter with rate-expiry handling
- [x] Tokenomics and roadmap information
- [x] Presale transaction code present, **disabled by default**
- [x] No hardcoded treasury account, presale contract address or presale price
- [x] BSC **testnet** selected; mainnet transactions explicitly guarded
- [ ] Publish to new GitHub Pages repository and test on public HTTPS URL
- [ ] Check on iPhone, Android, tablet and desktop, including wallet-app browsers

## Before any enabled public purchase
- [ ] Finalise the legally reviewed jurisdiction / financial-promotion route
- [ ] Complete appropriate public-offer disclosures, cooling-off/appropriateness flows, risk warnings, AML/KYC and location restrictions where required
- [ ] Approve marketing text, site labels and privacy/terms documents legally
- [ ] Decide GAM presale allocation from the existing 100 trillion GAM
- [ ] Decide GAM price/BNB, contribution limits, sale cap and accepted assets
- [ ] Decide token distribution (instant vs claim vs airdrop), refund and unsold-token policies
- [ ] Build, fully test and externally review the separate presale contract and relevant custody processes
- [ ] Ensure presale contract has quoteTokens(uint256), isSaleOpen(), buyTokens(uint256) functions
- [ ] Fund presale contract from an existing GAM allocation, not through new minting
- [ ] Perform full integration tests on BSC testnet (97)
- [ ] Verify contract source on explorer, publish address and audit results
- [ ] Only with all approvals, configure BSC mainnet (56), `sale.contractAddress`, `launch.opensAt`, and explicit publication switches in `assets/js/config.js`
- [ ] Remember browser-only configuration **cannot enforce legal compliance**; use approved identity and jurisdiction controls
- [ ] Do not make Angel Casino / 98% RTP / gambling incentives part of UK investor promotion without independent legal advice
- [ ] Keep emergency response and transaction support documentation ready
