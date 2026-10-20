/* Pure, dependency-free number helpers. Also importable by Node tests. */
(function (root) {
  'use strict';
  const WEI = 10n ** 18n;
  function toWei(text) {
    if (typeof text !== 'string' || !/^\d+(?:\.\d{1,18})?$/.test(text.trim())) throw new Error('Enter a valid BNB amount (up to 18 decimal places).');
    const [whole, frac = ''] = text.trim().split('.');
    return BigInt(whole) * WEI + BigInt((frac + '0'.repeat(18)).slice(0, 18));
  }
  function toHex(n) { if (n < 0n) throw new Error('Negative amounts are invalid.'); return '0x' + n.toString(16); }
  function encodeUint256(n) { if (n < 0n || n >= 2n ** 256n) throw new Error('Invalid uint256.'); return n.toString(16).padStart(64, '0'); }
  function formatUnits(raw, decimals = 18, maxFraction = 4) {
    const value = BigInt(raw); const minus = value < 0n ? '-' : ''; const abs = value < 0n ? -value : value;
    const base = 10n ** BigInt(decimals);
    const integer = (abs / base).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const frac = (abs % base).toString().padStart(decimals, '0').slice(0, maxFraction).replace(/0+$/, '');
    return minus + integer + (frac ? '.' + frac : '');
  }
  function countdown(target, nowMs) {
    if (!target) return null;
    const timestamp = Date.parse(target);
    if (!Number.isFinite(timestamp)) return null;
    const totalSeconds = Math.max(0, Math.ceil((timestamp - nowMs) / 1000));
    return { totalSeconds, days: Math.floor(totalSeconds / 86400), hours: Math.floor(totalSeconds % 86400 / 3600), minutes: Math.floor(totalSeconds % 3600 / 60), seconds: totalSeconds % 60 };
  }
  function validAddress(value) { return /^0x[a-fA-F0-9]{40}$/.test(value || '') && !/^0x0{40}$/i.test(value); }
  function bnBtoUsd(text, rate) { const n = Number(text); return Number.isFinite(n) && n >= 0 && Number.isFinite(rate) && rate > 0 ? n * rate : null; }
  const api = {toWei, toHex, encodeUint256, formatUnits, countdown, validAddress, bnBtoUsd, WEI};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.GambitMath = api;
})(typeof window === 'undefined' ? null : window);
