import { auth } from "@/services/auth";
import { baseURL } from "@/types/baseURL";
import type {
  CustomDocument,
  LoadDocumentsParams,
  LoadDocumentsResponse,
  LoadDocumentsResult,
  GenerateUploadUrlResponse,
  GenerateUploadUrlResult,
  SaveDocumentMetadataPayload,
  ViewDocumentUrlResponse,
  ViewDocumentUrlResult,
} from "@/types/document";

const DEFAULT_UPLOAD_TIMEOUT_MS = 30000;

async function fetchJsonErrorMessage(response: Response, fallback: string) {
  try {
    const errorData = await response.json();
    return errorData.message || fallback;
  } catch {
    return fallback;
  }
}

export async function loadDocuments(params: LoadDocumentsParams = {}): Promise<LoadDocumentsResult> {
  const searchParams = new URLSearchParams();

  if (typeof params.limit === "number") {
    searchParams.set("limit", String(params.limit));
  }

  if (params.cursor) {
    searchParams.set("cursor", params.cursor);
  }

  if (params.category) {
    searchParams.set("category", params.category);
  }

  const queryString = searchParams.toString();
  const response = await fetch(`${baseURL.getBaseURL()}/documents${queryString ? `?${queryString}` : ""}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${auth.getToken()}`,
    },
  });

  if (!response.ok) {
    console.error("Erro ao carregar documentos:", response.statusText);
    return {
      documents: [],
      nextCursor: null,
    };
  }

  const data = (await response.json()) as LoadDocumentsResponse | CustomDocument[] | { data?: CustomDocument[] };

  const normalizeDocument = (document: CustomDocument): CustomDocument => ({
    ...document,
  });

  if (Array.isArray(data)) {
    return {
      documents: data.map(normalizeDocument) as CustomDocument[],
      nextCursor: null,
    };
  }

  if (Array.isArray((data as LoadDocumentsResponse).documents)) {
    return {
      documents: (data as LoadDocumentsResponse).documents.map(normalizeDocument) as CustomDocument[],
      nextCursor: (data as LoadDocumentsResponse).nextCursor ?? null,
    };
  }

  if (Array.isArray((data as { data?: CustomDocument[] })?.data)) {
    return {
      documents: ((data as { data?: CustomDocument[] }).data ?? []).map(normalizeDocument) as CustomDocument[],
      nextCursor: null,
    };
  }

  return {
    documents: [],
    nextCursor: null,
  };
}

export async function generateUploadUrlAction(
  name: string,
  contentType: string,
): Promise<GenerateUploadUrlResult> {
  const response = await fetch(`${baseURL.getBaseURL()}/document/upload-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${auth.getToken()}`,
    },
    body: JSON.stringify({ name, contentType }),
  });

  if (!response.ok) {
    throw new Error(await fetchJsonErrorMessage(response, "Falha ao gerar URL pré-assinada"));
  }

  const data = (await response.json()) as GenerateUploadUrlResponse;
  return data.data;
}

export async function uploadFileToSignedUrlAction(
  uploadUrl: string,
  file: File,
  contentType: string,
  timeoutMs = DEFAULT_UPLOAD_TIMEOUT_MS,
): Promise<void> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
      },
      body: file,
      signal: controller.signal,
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("A URL pré-assinada expirou ou não tem permissão para upload");
      }

      throw new Error(`Falha ao enviar arquivo para o S3 (${response.status})`);
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Timeout ao enviar arquivo para o S3");
    }

    throw new Error(error instanceof Error ? error.message : "Erro inesperado no upload");
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function saveDocumentMetadataAction(payload: SaveDocumentMetadataPayload): Promise<void> {
  const response = await fetch(`${baseURL.getBaseURL()}/document/metadata`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${auth.getToken()}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await fetchJsonErrorMessage(response, "Falha ao salvar metadata do documento"));
  }
}

export async function uploadDocumentAction(params: {
  file: File;
  category?: string;
}): Promise<void> {
  const { file, category } = params;
  const uploadInfo = await generateUploadUrlAction(file.name, file.type);

  await uploadFileToSignedUrlAction(uploadInfo.uploadUrl, file, file.type);

  await saveDocumentMetadataAction({
    documentId: uploadInfo.documentId,
    name: file.name,
    key: uploadInfo.key,
    contentType: file.type,
    size: file.size,
    category: category?.trim() || undefined,
  });
}

export async function viewDocumentAction(documentId: string): Promise<ViewDocumentUrlResult> {
  let response: Response;

  try {
    response = await fetch(`${baseURL.getBaseURL()}/document/view-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${auth.getToken()}`,
      },
      body: JSON.stringify({ documentId }),
    });
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Falha de rede/CORS ao gerar URL de visualização: ${error.message}`
        : "Falha de rede/CORS ao gerar URL de visualização",
    );
  }

  if (!response.ok) {
    throw new Error(await fetchJsonErrorMessage(response, "Falha ao gerar URL de visualização"));
  }

  const data = (await response.json()) as ViewDocumentUrlResponse;
  return data.data;
}

export async function deleteDocumentAction(documentId: string): Promise<void> {
  const response = await fetch(`${baseURL.getBaseURL()}/document/${documentId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${auth.getToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error(await fetchJsonErrorMessage(response, "Falha ao excluir documento"));
  }
}