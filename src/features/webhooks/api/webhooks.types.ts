/** Webhook + delivery types — mirror the backend resources (org-scoped admin). */

export interface Webhook {
  id: string;
  organization_id: string;
  created_by: string | null;
  url: string;
  events: string[];
  secret: string | null;
  active: boolean;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event: string;
  status_code: number | null;
  success: boolean;
  error: string | null;
  attempts: number;
  delivered_at: string | null;
  created_at: string | null;
}
