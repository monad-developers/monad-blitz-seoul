import{MfaPasswordlessSmsInit as r}from"@privy-io/public-api";class t{async sendCode(t){return await this._privyInternal.fetch(r,{body:t})}constructor(r){this._privyInternal=r}}export{t as default};
