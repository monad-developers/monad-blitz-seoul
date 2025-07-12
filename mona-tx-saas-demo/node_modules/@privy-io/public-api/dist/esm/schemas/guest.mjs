import{z as t}from"zod";const e=t.object({guest_credential:t.string().length(43)}).strict();export{e as AuthenticateGuestInput};
