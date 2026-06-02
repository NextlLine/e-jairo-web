export type CustomDocument = {
  id: string;
  nome: string;
  arquivo: string;
  name?: string;
  key?: string;
  contentType?: string;
  size?: number;
  category?: string;
  createdAt?: string;
};

export type LoadDocumentsParams = {
  limit?: number;
  cursor?: string | null;
  name?: string;
  category?: string;
  q?: string;
  qType?: "name" | "category";
};

export type LoadDocumentsResult = {
  documents: CustomDocument[];
  nextCursor: string | null;
};

export type LoadDocumentsResponse = {
  documents: CustomDocument[];
  nextCursor: string | null;
};

export type GenerateUploadUrlResult = {
  id: string;
  uploadUrl: string;
  key: string;
};

export type GenerateUploadUrlResponse = {
  message: string;
  data: GenerateUploadUrlResult;
};

export type ViewDocumentUrlResult = {
  id: string;
  viewUrl: string;
  key: string;
};

export type ViewDocumentUrlResponse = {
  message: string;
  data: ViewDocumentUrlResult;
};

export type SaveDocumentMetadataPayload = {
  id: string;
  name: string;
  key: string;
  contentType: string;
  size: number;
  category?: string;
};