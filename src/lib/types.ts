export type Platform = "meta" | "google" | "apple" | "tiktok" | "other";

export interface Change {
  id: string;
  happened_at: string;
  app: string;
  platform: Platform;
  kind: string;
  entity: string | null;
  before_value: string | null;
  after_value: string | null;
  why: string | null;
  author_email: string | null;
}

export interface Task {
  id: string;
  text: string;
  app: string | null;
  day: string;
  done: boolean;
  done_on: string | null;
  author_email: string | null;
}

export interface AppRow {
  name: string;
}

