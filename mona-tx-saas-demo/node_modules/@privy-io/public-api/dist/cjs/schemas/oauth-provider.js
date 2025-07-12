"use strict";var t=require("zod");const e=t.z.object({redirect_to:t.z.string(),state:t.z.string(),code_challenge:t.z.string()});exports.AuthorizationCodeInput=e;
