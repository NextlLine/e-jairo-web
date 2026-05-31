export type CustomDocument = {
  id: string;
  nome: string;
  arquivo: string;
};

export type LoadDocumentsParams = {
  limit?: number;
  cursor?: string | null;
  category?: string;
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
  documentId: string;
  uploadUrl: string;
  key: string;
};

export type GenerateUploadUrlResponse = {
  message: string;
  data: GenerateUploadUrlResult;
};

export type ViewDocumentUrlResult = {
  documentId: string;
  viewUrl: string;
  key: string;
};

export type ViewDocumentUrlResponse = {
  message: string;
  data: ViewDocumentUrlResult;
};

export type SaveDocumentMetadataPayload = {
  documentId: string;
  name: string;
  key: string;
  contentType: string;
  size: number;
  category?: string;
};