import o from"zod";const t=o.object({chain:o.string(),asset:o.enum(["native-currency","USDC"]).optional()});export{t as Currency};
