import{z as o}from"zod";const n=o.object({event_name:o.string().max(255),client_id:o.string().max(255).nullable(),payload:o.record(o.any()).optional()});export{n as AnalyticsEventInput};
