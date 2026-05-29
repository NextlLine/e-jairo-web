export type CustomDocument = {
  nome: string;
  arquivo: string;
};

export type GenerateUploadUrlResult = {
  documentId: string;
  uploadUrl: string;
  key: string;
};

export type GenerateUploadUrlResponse = {
  message: string;
  data: GenerateUploadUrlResult;
};

export type SaveDocumentMetadataPayload = {
  documentId: string;
  name: string;
  key: string;
  contentType: string;
  size: number;
  category?: string;
};