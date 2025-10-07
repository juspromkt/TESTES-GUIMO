export interface Anuncio {
  Id: number;
  title: string;
  body: string;
  mediaType: string;
  thumbnailUrl: string;
  mediaUrl: string;
  sourceId?: string;
}