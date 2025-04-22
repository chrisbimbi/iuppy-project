import { NewsSettings } from "./NewsSettings";
import { NewsType } from "./NewsType";

export interface UpdateNewsDto {
  title?: string;
  subtitle?: string;
  content?: string;
  channelId?: string;
  authorId?: string;
  type?: NewsType;
  isPublished?: boolean;
  attachments?: { url: string; name: string }[]; // Estrutura consistente com CreateNewDto
  highlightImages?: { url: string; altText?: string }[]; // Estrutura consistente com CreateNewDto
  settings?: NewsSettings;
  updatedAt?: Date; // Adicionado para refletir a data de atualização
}