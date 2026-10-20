/*
 * GAMBIT PRESALE STATIC FRONTEND
 * No third-party wallet library required. Uses the EIP-1193 provider protocol,
 * EIP-6963 multi-wallet discovery and raw ABI encoding for three contract calls.
 * All transaction values and bounds are checked again on-chain by the eventual
 * presale contract. Browser logic must NEVER be used as a compliance gate.
 */
(() => {
  'use strict';
  const C = window.GAMBIT_CONFIG;
  const M = window.GambitMath;
  if (!C || !M) { console.error('Gambit configuration or logic missing.'); return; }

  // 4-byte Keccak-256 selectors of the expected independent presale contract ABI.
  // Derivations verified against Keccak-256 of the canonical function signatures.
  const ABI = Object.freeze({quoteTokens: '0x2c9115c7', buyTokens: '0x3610724e', isSaleOpen: '0x1a081330'});
  const $ = (id) => document.getElementById(id);
  const state = { provider: null, address: null, chainId: null, usdRate: null, usdAt: 0,
    priceSource: '', quote: null, onchainOpen: false, busy: false, txPending: false,
    quoteSeq: 0, toastTimer: null, quoteTimer: null, walletChoices: new Map() };

  function notify(message) {
    $('toast').textContent = String(message);
    $('toast').classList.add('visible');
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 5500);
  }
  function shortAddress(addr) { return addr ? addr.slice(0, 6) + '…' + addr.slice(-4) : ''; }
  function networkCorrect() { return state.chainId === Number(C.network.chainId); }
  function saleContractConfigured() { return M.validAddress(C.sale.contractAddress); }
  function timerDone() { const t = M.countdown(C.launch.opensAt, Date.now()); return !!t && t.totalSeconds === 0; }
  function publicSaleConfigured() {
    return C.sale.active === true && C.sale.legalSignoff === true && saleContractConfigured() &&
      (Number(C.network.chainId) !== 56 || C.sale.allowMainnet === true) && timerDone();
  }
  function rateIsFresh() { return Number.isFinite(state.usdRate) && state.usdRate > 0 && Date.now() - state.usdAt < C.rates.expiresMs; }
  function parseAmount() { try { return M.toWei($('bnbAmount').value); } catch { return null; } }
  function parseBounds() {
    const amount = parseAmount();
    if (amount === null || amount === 0n) return 'Enter a valid amount greater than zero.';
    if (amount < M.toWei(C.sale.minBNB)) return `Minimum is ${C.sale.minBNB} ${C.network.nativeCurrency.symbol}.`;
    if (amount > M.toWei(C.sale.maxBNB)) return `Maximum is ${C.sale.maxBNB} ${C.network.nativeCurrency.symbol}.`;
    return null;
  }
  function renderCountdown() {
    const remaining = M.countdown(C.launch.opensAt, Date.now());
    const ids = ['days', 'hours', 'minutes', 'seconds'];
    if (!remaining) {
      ids.forEach(id => $(id).textContent = '--');
      $('launchLabel').textContent = C.launch.label || 'Date to be announced';
    } else {
      ids.forEach((id) => $(id).textContent = String(remaining[id]).padStart(2, '0'));
      $('launchLabel').textContent = remaining.totalSeconds ?
        `Target: ${new Date(C.launch.opensAt).toLocaleString('en-GB', {dateStyle: 'long', timeStyle: 'short', timeZone: 'UTC'})} UTC` :
        'Countdown complete — awaiting independent sale activation';
    }
    renderSaleStatus();
  }
  function renderPrice() {
    const input = $('bnbAmount').value;
    const usd = rateIsFresh() ? M.bnBtoUsd(input, state.usdRate) : null;
    $('usdAmount').textContent = usd === null ? 'Market rate unavailable' :
      '≈ ' + usd.toLocaleString('en-US', {style: 'currency', currency: 'USD', maximumFractionDigits: 2});
    $('usdRate').textContent = rateIsFresh() ?
      `1 BNB ≈ $${state.usdRate.toLocaleString('en-US', {maximumFractionDigits: 2})} · ${state.priceSource}` :
      'Unavailable · try again later';
  }
  async function fetchWithTimeout(url, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const r = await fetch(url, {signal: controller.signal, cache: 'no-store', headers: {'Accept': 'application/json'}});
      if (!r.ok) throw new Error('Rate HTTP ' + r.status);
      return await r.json();
    } finally { clearTimeout(timer); }
  }
  async function fetchRate() {
    // Browser-only request; some environments block public APIs or rate-limit traffic.
    const services = [
      {name: 'CoinGecko', url: 'https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd', pick: d => Number(d?.binancecoin?.usd)},
      {name: 'CryptoCompare', url: 'https://min-api.cryptocompare.com/data/price?fsym=BNB&tsyms=USD', pick: d => Number(d?.USD)}
    ];
    let latest = null;
    for (const s of services) {
      try {
        const value = s.pick(await fetchWithTimeout(s.url, C.rates.timeoutMs));
        if (Number.isFinite(value) && value > 0) { latest = {value, source: s.name}; break; }
      } catch (err) { console.info('BNB price source unavailable:', s.name, err.message); }
    }
    if (latest) { state.usdRate = latest.value; state.usdAt = Date.now(); state.priceSource = latest.source; }
    if (!rateIsFresh()) { state.usdRate = null; state.usdAt = 0; state.priceSource = ''; }
    renderPrice();
  }
  function renderSaleStatus() {
    const ready = publicSaleConfigured();
    const saleText = ready && state.onchainOpen ? 'PRESALE CONFIGURED' : 'SALE NOT OPEN';
    $('saleStatus').textContent = saleText;
    $('saleInfo').textContent = !C.sale.active ?
      'Preview mode: wallet connection is available, but no purchase can be submitted.' :
      !publicSaleConfigured() ? 'Sale is not yet enabled. No funds can be submitted.' :
      !state.address ? 'Connect a wallet to obtain an on-chain quote.' :
      !networkCorrect() ? 'Switch to the configured BNB network before proceeding.' :
      !state.onchainOpen ? 'The sale contract has not confirmed that the sale is open.' :
      'Sale interface configured. Verify contract, quote and transaction details before signing.';
    const err = state.address && networkCorrect() ? parseBounds() : null;
    const enabled = ready && state.address && networkCorrect() && state.onchainOpen &&
      state.quote !== null && state.quote > 0n && !err && !state.busy;
    $('purchaseButton').disabled = !enabled;
    $('purchaseButton').textContent = state.txPending ? 'Transaction pending…' :
      state.busy ? 'Processing…' :
      !C.sale.active ? 'Presale not live' :
      !ready ? 'Presale unavailable' :
      !state.address ? 'Connect wallet first' :
      !networkCorrect() ? 'Switch network first' :
      !state.onchainOpen ? 'Sale contract not open' :
      err ? err :
      state.quote === null ? 'Waiting for on-chain quote' : 'Review purchase in wallet';
    $('cardConnect').textContent = state.address ? `Wallet: ${shortAddress(state.address)} · Disconnect` : 'Connect a wallet';
    $('switchNetwork').classList.toggle('hidden', !(state.address && !networkCorrect()));
    $('headerConnectText').textContent = state.address ? shortAddress(state.address) : 'Connect wallet';
    document.querySelector('.connect-indicator')?.classList.toggle('connected', !!state.address);
  }

  function updateEstimate(message = '') {
    $('gamEstimate').textContent = state.quote !== null ? M.formatUnits(state.quote, 18, 4) + ' GAM' : '—';
    $('quoteInfo').textContent = message || (state.quote === null ?
      'GAM quotation will come directly from the deployed sale contract, not the USD calculator.' :
      'Live contract quotation, subject to change before confirmation and on-chain limits.');
    renderSaleStatus();
  }

  function getInjectedWallets() {
    const found = new Map(state.walletChoices);
    const eth = window.ethereum;
    if (eth) {
      const providers = Array.isArray(eth.providers) ? eth.providers : [eth];
      providers.forEach((p, i) => {
        const name = p.isMetaMask ? 'MetaMask' : p.isTrust ? 'Trust Wallet' : p.isCoinbaseWallet ? 'Coinbase Wallet' : `Browser Wallet ${i + 1}`;
        if (![...found.values()].some(v => v.provider === p)) found.set('injected-' + i, {name, provider: p});
      });
    }
    return [...found.values()];
  }
  function showWalletDialog() {
    const list = $('walletList'); list.replaceChildren();
    const found = getInjectedWallets();
    if (!found.length) {
      const note = document.createElement('p'); note.textContent = 'No wallet detected in this browser. On mobile, open the site in your wallet’s in-app browser. On desktop, install a compatible extension.'; list.appendChild(note);
    } else {
      found.forEach(w => {
        const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'wallet-choice';
        const letter = document.createElement('span'); letter.className = 'wallet-letter'; letter.textContent = (w.name || 'W')[0];
        const txt = document.createElement('span'); txt.textContent = w.name || 'Wallet'; btn.append(letter, txt);
        btn.addEventListener('click', async () => { $('walletDialog').close(); await connectWallet(w.provider); }); list.appendChild(btn);
      });
    }
    // Only the current public URL is used; do not construct a purchase/send deep link.
    const publicSite = /^https?:$/.test(window.location.protocol) && !['localhost', '127.0.0.1'].includes(location.hostname);
    $('mobileWalletLink').classList.toggle('hidden', !publicSite);
    if (publicSite) $('mobileWalletLink').href = 'https://link.metamask.io/dapp/' + window.location.href.replace(/^https?:\/\//, '');
    $('walletDialog').showModal();
  }
  async function request(provider, method, params = []) { return provider.request({method, params}); }
  async function connectWallet(provider) {
    if (!provider) { notify('No compatible wallet was detected.'); return; }
    try {
      const accounts = await request(provider, 'eth_requestAccounts');
      if (!accounts?.length || !M.validAddress(accounts[0])) throw new Error('No wallet account was authorised.');
      if (state.provider && typeof state.provider.removeListener === 'function') {
        state.provider.removeListener('accountsChanged', handleAccounts);
        state.provider.removeListener('chainChanged', handleChain);
        state.provider.removeListener('disconnect', handleDisconnect);
      }
      state.provider = provider;
      if (typeof provider.on === 'function') {
        provider.on('accountsChanged', handleAccounts);
        provider.on('chainChanged', handleChain);
        provider.on('disconnect', handleDisconnect);
      }
      state.address = accounts[0];
      await refreshWallet();
      notify('Wallet connected. Connection does not authorise a payment.');
    } catch (e) { notify(e.code === 4001 ? 'Wallet connection declined.' : 'Could not connect wallet: ' + (e.shortMessage || e.message)); }
  }
  function handleAccounts(accounts) {
    state.address = accounts?.length && M.validAddress(accounts[0]) ? accounts[0] : null;
    state.quote = null; state.onchainOpen = false;
    if (state.address) refreshWallet(); else { $('balanceText').textContent = 'Wallet not connected'; updateEstimate(); }
  }
  function handleChain(chain) { state.chainId = Number(BigInt(chain)); state.quote = null; state.onchainOpen = false; refreshWallet(); }
  function handleDisconnect() { disconnectWallet(); }
  function disconnectWallet() {
    // EIP-1193 extension permissions are managed in the wallet; this disconnects this UI only.
    if (state.provider?.removeListener) {
      state.provider.removeListener('accountsChanged', handleAccounts);
      state.provider.removeListener('chainChanged', handleChain);
      state.provider.removeListener('disconnect', handleDisconnect);
    }
    state.provider = null; state.address = null; state.chainId = null; state.quote = null; state.onchainOpen = false;
    $('balanceText').textContent = 'Wallet not connected'; updateEstimate(); notify('Wallet disconnected from this page. Revoke site permissions in the wallet if needed.');
  }
  async function refreshWallet() {
    if (!state.provider || !state.address) return;
    try {
      state.chainId = Number(BigInt(await request(state.provider, 'eth_chainId')));
      if (!networkCorrect()) { $('balanceText').textContent = 'Wrong network'; state.quote = null; state.onchainOpen = false; updateEstimate('Switch to the configured BNB network to request a quote.'); return; }
      const weiBalance = BigInt(await request(state.provider, 'eth_getBalance', [state.address, 'latest']));
      $('balanceText').textContent = 'Balance: ' + M.formatUnits(weiBalance, 18, 4) + ' ' + C.network.nativeCurrency.symbol;
      await refreshQuote();
    } catch (e) { $('balanceText').textContent = 'Balance unavailable'; updateEstimate('Wallet read failed: ' + (e.shortMessage || e.message)); }
    renderSaleStatus();
  }
  async function switchChain() {
    if (!state.provider) return showWalletDialog();
    const hex = '0x' + Number(C.network.chainId).toString(16);
    try {
      await request(state.provider, 'wallet_switchEthereumChain', [{chainId: hex}]);
    } catch (e) {
      if (e.code !== 4902) return notify('Network switch not completed: ' + (e.message || 'Wallet rejected request.'));
      try {
        await request(state.provider, 'wallet_addEthereumChain', [{chainId: hex, chainName: C.network.chainName, nativeCurrency: C.network.nativeCurrency, rpcUrls: C.network.rpcUrls, blockExplorerUrls: C.network.blockExplorerUrls}]);
      } catch (err) { notify('Could not add BNB network: ' + err.message); return; }
    }
    await refreshWallet();
  }
  async function contractCall(data) {
    if (!state.provider || !networkCorrect() || !saleContractConfigured()) throw new Error('Contract or network unavailable.');
    const hexResult = await request(state.provider, 'eth_call', [{to: C.sale.contractAddress, data}, 'latest']);
    if (typeof hexResult !== 'string' || !/^0x[0-9a-f]+$/i.test(hexResult) || hexResult.length < 66) throw new Error('Contract returned no valid data. Check ABI and address.');
    return BigInt(hexResult);
  }
  async function refreshQuote() {
    const mySequence = ++state.quoteSeq;
    state.quote = null; state.onchainOpen = false;
    if (!saleContractConfigured()) return updateEstimate('GAM quotation is unavailable until a presale contract address is configured.');
    if (!state.address || !networkCorrect()) return updateEstimate('Connect a wallet on the configured BNB network for an on-chain quotation.');
    const amount = parseAmount();
    if (amount === null || amount === 0n) return updateEstimate('Enter a valid amount of BNB.');
    updateEstimate('Reading a fresh quotation from the sale contract…');
    try {
      const code = await request(state.provider, 'eth_getCode', [C.sale.contractAddress, 'latest']);
      if (code === '0x' || code === '0x0') throw new Error('No contract deployed at the configured address.');
      const open = await contractCall(ABI.isSaleOpen);
      const quote = await contractCall(ABI.quoteTokens + M.encodeUint256(amount));
      if (mySequence !== state.quoteSeq) return;
      state.onchainOpen = open !== 0n;
      state.quote = quote > 0n ? quote : null;
      updateEstimate(!state.onchainOpen ? 'The sale contract reports that the sale is closed.' : 'Live contract quote. No USD-to-GAM conversion is assumed.');
    } catch (e) {
      if (mySequence !== state.quoteSeq) return;
      state.quote = null; state.onchainOpen = false;
      updateEstimate('Could not obtain an on-chain quote. ' + (e.shortMessage || e.message));
    }
  }
  async function purchase() {
    if (state.busy) return;
    // Verify EVERY condition immediately before requesting a transaction.
    if (!publicSaleConfigured() || !state.address || !networkCorrect() || !state.onchainOpen || !saleContractConfigured()) return notify('Presale not available. No transaction was sent.');
    if (parseBounds()) return notify(parseBounds());
    if (!state.quote || state.quote <= 0n) return notify('Fresh on-chain quote required.');
    state.busy = true; renderSaleStatus();
    try {
      await refreshQuote(); // Avoid reusing stale quote from previous amount or contract state.
      if (!publicSaleConfigured() || !state.onchainOpen || !state.quote) throw new Error('The sale is not open or its quote is unavailable.');
      const amount = parseAmount(); if (!amount || parseBounds()) throw new Error(parseBounds() || 'Invalid amount.');
      const slippageBps = Number(C.sale.slippageBps);
      if (!Number.isInteger(slippageBps) || slippageBps < 0 || slippageBps > 1000) throw new Error('Invalid slippage configuration.');
      const minGAM = state.quote * BigInt(10000 - slippageBps) / 10000n;
      if (!minGAM) throw new Error('Quoted allocation too small.');
      // Sends BNB ONLY to configured presale contract, never to a treasury EOA.
      const tx = await request(state.provider, 'eth_sendTransaction', [{from: state.address, to: C.sale.contractAddress, value: M.toHex(amount), data: ABI.buyTokens + M.encodeUint256(minGAM)}]);
      state.txPending = true; renderSaleStatus();
      notify('Transaction submitted to the wallet/network. Confirming on chain…');
      const chainAtSubmit = state.chainId;
      const receipt = await waitForReceipt(tx, chainAtSubmit);
      if (receipt?.status === '0x1') notify('Transaction confirmed on chain. Check the explorer for your allocation/claim terms.');
      else if (receipt?.status === '0x0') notify('Transaction reverted. Review the transaction on the explorer.');
      else notify('Confirmation is still pending. Check the explorer for transaction status.');
      if (/^0x[\da-f]{64}$/i.test(tx)) { const link = document.createElement('a'); link.href = C.network.blockExplorerUrls[0] + '/tx/' + tx; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = 'View latest transaction ↗'; $('quoteInfo').replaceChildren(link); }
      refreshWallet();
    } catch (e) { notify(e.code === 4001 ? 'Purchase was rejected in your wallet. No payment was sent.' : 'Purchase failed: ' + (e.shortMessage || e.message)); }
    finally { state.busy = false; state.txPending = false; renderSaleStatus(); }
  }
  async function waitForReceipt(hash, chainAtSubmit) {
    if (!/^0x[\da-f]{64}$/i.test(hash)) throw new Error('Wallet returned an invalid transaction hash.');
    const until = Date.now() + 90000; // Do not pretend a timed-out transaction has failed.
    while (Date.now() < until) {
      if (!state.provider || state.chainId !== chainAtSubmit) return null;
      try {
        const receipt = await request(state.provider, 'eth_getTransactionReceipt', [hash]);
        if (receipt) return receipt;
      } catch (e) { console.info('Receipt poll delayed:', e.message); }
      await new Promise(resolve => setTimeout(resolve, 3500));
    }
    return null;
  }
  function onAmountInput() {
    renderPrice(); state.quote = null; state.onchainOpen = false; updateEstimate('Refreshing on-chain quotation…');
    clearTimeout(state.quoteTimer); state.quoteTimer = setTimeout(refreshQuote, 450);
  }
  function initWalletDiscovery() {
    window.addEventListener('eip6963:announceProvider', e => {
      const {info, provider} = e.detail || {};
      if (info?.uuid && provider?.request) state.walletChoices.set(info.uuid, {name: info.name || 'Browser Wallet', provider});
    });
    window.dispatchEvent(new Event('eip6963:requestProvider'));
  }
  function init() {
    $('year').textContent = new Date().getFullYear();
    $('bnbSymbol').textContent = C.network.nativeCurrency.symbol;
    if (saleContractConfigured()) {
      const link = document.createElement('a');
      link.textContent = shortAddress(C.sale.contractAddress) + ' ↗';
      link.href = C.network.blockExplorerUrls[0] + '/address/' + C.sale.contractAddress;
      link.target = '_blank'; link.rel = 'noopener noreferrer';
      $('saleContractDisplay').replaceChildren(link);
    } else $('saleContractDisplay').textContent = 'Not deployed';
    $('bnbHint').textContent = Number(C.network.chainId) === 97 ?
      'Testnet BNB has no monetary value. USD below is a MAINNET BNB reference only.' :
      'BNB Smart Chain native coin · USD reference is indicative only.';
    $('headerConnect').addEventListener('click', () => state.address ? disconnectWallet() : showWalletDialog());
    $('cardConnect').addEventListener('click', () => state.address ? disconnectWallet() : showWalletDialog());
    $('switchNetwork').addEventListener('click', switchChain);
    $('purchaseButton').addEventListener('click', purchase);
    $('bnbAmount').addEventListener('input', onAmountInput);
    $('navToggle').addEventListener('click', () => {
      const open = $('mobileNav').hidden;
      $('mobileNav').hidden = !open;
      $('navToggle').setAttribute('aria-expanded', String(open));
    });
    $('mobileNav').querySelectorAll('a').forEach(a => a.addEventListener('click', () => { $('mobileNav').hidden = true; $('navToggle').setAttribute('aria-expanded', 'false'); }));
    document.addEventListener('visibilitychange', () => { if (!document.hidden) { renderCountdown(); if (!rateIsFresh()) fetchRate(); } });
    initWalletDiscovery(); renderCountdown(); renderPrice(); updateEstimate(); fetchRate();
    setInterval(renderCountdown, 1000);
    setInterval(fetchRate, Number(C.rates.refreshMs) || 60000);
    setInterval(() => { if (state.address && networkCorrect() && publicSaleConfigured()) refreshQuote(); }, 30000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
