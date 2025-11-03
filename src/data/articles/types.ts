export interface Article {
  id: string;
  title: string;
  description: string;
  content: string;
  category: 'artigos';
  readTime?: string;
  tags?: string[];
}
