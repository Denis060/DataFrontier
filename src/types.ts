export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  author_name: string;
  read_time: string;
  featured: boolean;
  published: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  article_count: number;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  company_logo?: string;
  location: string;
  salary: string;
  tags: string[];
  remote: boolean;
  published: boolean;
  created_at: string;
}

export interface Subscriber {
  id: string;
  email: string;
  subscribed_at: string;
  active: boolean;
}

export interface TickerItem {
  id: string;
  text: string;
  active: boolean;
  order: number;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: string;
}
