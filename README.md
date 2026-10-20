# Gambit (GAM) — GitHub Pages Presale Website

**Version:** 1.0 website preview (19 October 2026)  
**Status:** GitHub Pages-ready, static frontend; **public purchases DISABLED by default**  
**Chain:** BNB Smart Chain **testnet** (chain ID 97) initially

A responsive static presale website for GAM, built with plain HTML, CSS and JavaScript. No build step or database is needed to publish the preview. The site provides wallet connectivity, an editable countdown, tokenomics information and live *indicative* BNB/USD conversion. The purchase transaction integration is written but cannot be made operational until a **separately deployed, security-reviewed and compatible presale smart contract** and required business/legal controls exist.

## Quick start: GitHub Pages

1. Extract the ZIP. Upload the **contents of this folder** to the root of a new GitHub repository. `index.html` must be at the root, not inside another nested folder.
2. On GitHub, open **Settings → Pages**. For **Build and deployment**, select **Deploy from a branch** → branch `main` → folder `/(root)`. Save.
3. After publication, GitHub will show a URL like `https://USERNAME.github.io/REPOSITORY/`.
4. The website should immediately show a GAM landing page, countdown placeholder, calculator, tokenomics and wallet-connect controls. All live purchases stay disabled.
5. To use a custom domain later, go to **Settings → Pages → Custom domain** and add your chosen domain. Configure the correct DNS entry with your registrar and enable **Enforce HTTPS** when available. Add/update `CNAME` only once the domain is chosen; no imaginary address is included here.

**Local preview:** From this folder run `python3 -m http.server 8000`, then visit `http://localhost:8000/`.

## Editing the timer, status and wallet network

**All editable settings live in `assets/js/config.js`.** Edit this file in GitHub and commit changes; GitHub Pages republishes the revised site automatically. No JavaScript knowledge is required to change the date.

Example launch configuration (example **only**, not an announced date):

```js
launch: {
  opensAt: '2027-01-20T18:00:00Z', // UTC, including Z/offset
  label: 'Launch date to be announced'
},
```

- `opensAt: null` means no launch date has been announced. The timer displays `--`.
- A valid ISO 8601 timestamp creates a live days/hours/minutes/seconds countdown **in the visitor's browser**. Server-side scheduling is not needed.
- When the countdown reaches zero, the site **does not automatically enable purchases**. A countdown alone proves nothing about on-chain readiness.
- `sale.active`, `sale.legalSignoff`, `sale.allowMainnet` and `sale.contractAddress` must be set deliberately; they are **client-side publication safeguards only**, NOT regulatory/identity controls. All regulatory constraints must be handled by a properly built back end and/or legally designed smart contract.

## Wallet connection

- Supports browser wallets with an **EIP-1193** provider, including MetaMask and other compatible injected wallets. Detects multiple wallets using **EIP-6963** where supported.
- Offers a **MetaMask mobile deep link** to open the published website inside the wallet browser on phones without an injected wallet.
- Can request a switch to the configured BSC chain. Uses chain ID **97 (testnet)** initially; BSC mainnet uses **56**.
- Wallet connection only requests the address/chain and reads balance. It **does not** transfer funds or ask for a seed phrase.
- No third-party wallet library, CDN or API key is needed for wallet connection; MetaMask and other wallets provide the EIP-1193 API.
- **WalletConnect QR support is not bundled.** It requires a separate provider/SDK, project ID and additional testing; the included MetaMask mobile link is the initial mobile path.

## BNB ↔ USD conversion

- Fetches **BNB/USD** from the CoinGecko public `simple/price` endpoint, with CryptoCompare as a fallback. Checks every 60 seconds; after three minutes without a fresh quote the USD field becomes **unavailable** rather than using an old rate.
- Market-data APIs may have rate limits, CORS restrictions and downtime. There is no hardcoded USD rate or fictional conversion.
- The default testnet (`tBNB`) has **no cash value**. Any displayed dollar amount is explicitly a **mainnet BNB price reference**, not the real market value of testnet tokens.
- The rate is **for information only**. Final GAM quantity is read from a presale smart contract; the displayed USD value **cannot** set the presale exchange price.
- The web page does not support card payments, stablecoin payment or exchange-account wallets in this version.

## Purchase contract integration (NOT yet deployed)

The website expects a future **standalone sale contract**, different from `GambitToken.sol`. It must match exactly these three public functions:

```solidity
interface IGambitPresale {
    function quoteTokens(uint256 bnbAmountWei) external view returns (uint256 gamBaseUnits);
    function isSaleOpen() external view returns (bool);
    function buyTokens(uint256 minGamBaseUnits) external payable;
}
```

The site:

1. Requires a configured EVM contract address, correct wallet network and current countdown complete.
2. Reads `eth_getCode` to confirm code exists at the address.
3. Requests `isSaleOpen()` and `quoteTokens(bnbWei)` through `eth_call`.
4. Shows the **on-chain GAM quantity**, with correct 18-decimal scaling.
5. Re-reads the quote at click time and enforces a configurable maximum 1% slippage using `minGamBaseUnits`.
6. Requests the connected wallet to sign **`buyTokens(minGamBaseUnits)` with BNB value**, addressed only to the **configured presale contract**, never a personal treasury address.
7. Displays submission/confirmation status and an explorer link to the transaction hash.

The separately created contract MUST validate purchase timing, contributions, recipient entitlements, token inventories, pricing, sale caps, reentrancy, refund or claim mechanics, token custody and any required per-user restrictions **on chain**. No frontend check is sufficient. It must use already minted GAM tokens from an existing allocation; the GAM core token cannot mint extra GAM.

**Important:** This expected interface is a proposal for the presale smart contract, which has **not been created or deployed yet**. There is no known valid contract address or live token price. The site intentionally never invents either.

## Before any real-money launch

- Independently compile, test, security audit and verify the core GAM and presale contracts.
- Decide presale percentage from the fixed supply, contributions accepted, GAM/BNB pricing, minimum/maximum amounts, dates, vesting/claim vs airdrop mechanics, unsold tokens, minimum raise, refunds, presale proceeds custody and liquidity funding.
- Arrange legal advice for all targeted jurisdictions. Websites marketing qualifying cryptoassets to UK consumers may require lawful financial-promotion communication/approval, specified risk warnings, investor categorisation, appropriateness checks and cooling-off journeys. A static site and a checkbox **do not satisfy these automatically**.
- Do not market purchases as giving gambling access, free spins, superior RTP or financial returns pending specialist advice and applicable gaming authorisations.
- Build server-side or approved third-party eligibility / jurisdiction / KYC / AML processes where required. GitHub Pages serves static public files and **cannot securely store secrets or enforce identity controls by itself**.
- Complete browser, wallet, gas, failed-transaction, edge-case and adversarial integration testing with the exact verified presale contract on testnet, then mainnet.
- Never publish private keys, mnemonics, administrative credentials or confidential API secrets in this repository.

## Files

```
index.html               – Complete page and content
assets/css/styles.css    – Responsive visual design
assets/js/config.js      – Editable launch, BSC and presale settings
assets/js/logic.js       – Pure amount/number and countdown helpers
assets/js/app.js         – Wallet connect, BNB/USD rate, on-chain quote, purchase
assets/icons/favicon.svg – GAM brand icon
.nojekyll                – Ensure GitHub Pages serves static files directly
robots.txt               – Search crawler rules
docs/LAUNCH_CHECKLIST.md – Pre-publication operational checklist
tests/logic.test.js      – Offline unit tests (node --test)
```

## Manual QA quick checks

- Load in iOS Safari, an EVM wallet in-app browser and desktop Chrome.
- Test wallet connect/reject, multiple wallet providers, account switching, wrong BSC network, and no-wallet mobile deep link.
- Test countdown with an explicit UTC date, a passed date and `null`.
- Test BNB price network-offline handling and accuracy against independent reference feeds.
- Test invalid amounts, leading zeros, 18-digit decimals, maximum amounts and small wallet balances.
- Test sale contract ABI and transaction hashes on **testnet only** before configuring real-value transactions.
- Check footer risk text and all legal materials with qualified counsel prior to publishing a sale.

## Primary references

- BNB Chain RPC/chain IDs: https://docs.bnbchain.org/bnb-smart-chain/developers/json_rpc/json-rpc-endpoint/
- MetaMask mobile deep links: https://docs.metamask.io/metamask-connect/evm/guides/metamask-exclusive/use-deeplinks/
- GitHub Pages custom domain: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- FCA UK cryptoasset promotions: https://www.fca.org.uk/firms/cryptoassets/marketing-uk-consumers
