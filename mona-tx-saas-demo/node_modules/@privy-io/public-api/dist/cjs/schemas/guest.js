"use strict";var t=require("zod");const e=t.z.object({guest_credential:t.z.string().length(43)}).strict();exports.AuthenticateGuestInput=e;
