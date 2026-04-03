export interface Project {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  plan: string;
  generations_used: number;
  generations_limit: number;
  generations_reset_at: string;
}
