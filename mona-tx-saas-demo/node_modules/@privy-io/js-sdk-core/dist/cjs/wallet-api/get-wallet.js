"use strict";var t=require("@privy-io/public-api");exports.getWallet=async function(e,{wallet_id:a}){return await e.fetchPrivyRoute(t.WalletGet,{params:{wallet_id:a}})};
