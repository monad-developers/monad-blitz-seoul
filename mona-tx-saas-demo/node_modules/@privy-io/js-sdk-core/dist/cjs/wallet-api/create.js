"use strict";var e=require("@privy-io/public-api");exports.create=async function(r,{request:t}){return await r.fetchPrivyRoute(e.WalletCreate,{body:t})};
