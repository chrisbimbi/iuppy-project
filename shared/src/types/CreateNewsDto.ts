import { NewsSettings } from "./NewsSettings";
import { NewsType } from "./NewsType";

export interface CreateNewsDto {
  title: string;
  subtitle?: string;
  content: string;
  channelId: string;
  authorId: string;
  type: NewsType; // Deve corresponder ao enum ou tipo usado no backend
  isPublished: boolean;
  attachments: { url: string; name: string }[]; // Exemplo de estrutura para arquivos
  highlightImages: { url: string; altText?: string }[]; // Exemplo de estrutura para imagens
  settings: NewsSettings; // Deve refletir a estrutura do backend
  createdAt?: string; // Adicionado caso o backend envie a data de criação
  updatedAt?: string; // Adicionado caso o backend envie a data de atualização
}