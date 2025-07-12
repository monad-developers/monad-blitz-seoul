"use strict";var e=require("zod");const r=e.z.object({refresh_token:e.z.string()}),t=r.partial();exports.OptionalRefreshTokenInput=t,exports.RefreshTokenInput=r;
