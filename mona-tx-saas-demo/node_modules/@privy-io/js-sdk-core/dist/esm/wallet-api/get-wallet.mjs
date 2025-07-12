import{WalletGet as i}from"@privy-io/public-api";async function t(t,{wallet_id:a}){return await t.fetchPrivyRoute(i,{params:{wallet_id:a}})}export{t as getWallet};
