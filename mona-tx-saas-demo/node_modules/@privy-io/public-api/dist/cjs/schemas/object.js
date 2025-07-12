"use strict";var e=require("zod");const s=e.z.record(e.z.string(),e.z.never()),c=e.z.object({success:e.z.boolean()});exports.EmptyObject=s,exports.SuccessObject=c;
