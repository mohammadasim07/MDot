import type {
  DocumentImage, ImageSide, PrintJob, PrintJobRequest,
  PaperSize, Printer, QueueStats, PagedResponse, JobStatus
} from '../types';

const API_BASE = '/api';

/**
 * Generic fetch wrapper with error handling.
 */
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: `Request failed: ${response.statusText}`,
      error: 'UNKNOWN',
    }));
    throw new Error(error.message || `Request failed: ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) return {} as T;

  return response.json();
}

// ==================== Image API ====================

export const imageApi = {
  upload: async (file: File, side: ImageSide): Promise<DocumentImage> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('side', side);

    const response = await fetch(`${API_BASE}/images/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message);
    }

    return response.json();
  },

  getMetadata: (id: string) =>
    apiFetch<DocumentImage>(`/images/${id}`),

  getFileUrl: (id: string) =>
    `${API_BASE}/images/${id}/file`,

  delete: (id: string) =>
    apiFetch<{ message: string }>(`/images/${id}`, { method: 'DELETE' }),
};

// ==================== Print Job API ====================

export const jobApi = {
  create: (request: PrintJobRequest) =>
    apiFetch<PrintJob>('/jobs', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  get: (id: string) =>
    apiFetch<PrintJob>(`/jobs/${id}`),

  list: (params?: { status?: JobStatus[]; page?: number; size?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) params.status.forEach(s => searchParams.append('status', s));
    if (params?.page !== undefined) searchParams.set('page', String(params.page));
    if (params?.size !== undefined) searchParams.set('size', String(params.size));
    return apiFetch<PagedResponse<PrintJob>>(`/jobs?${searchParams}`);
  },

  update: (id: string, request: PrintJobRequest) =>
    apiFetch<PrintJob>(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    }),

  submit: (id: string) =>
    apiFetch<PrintJob>(`/jobs/${id}/submit`, { method: 'POST' }),

  cancel: (id: string) =>
    apiFetch<PrintJob>(`/jobs/${id}/cancel`, { method: 'POST' }),

  retry: (id: string) =>
    apiFetch<PrintJob>(`/jobs/${id}/retry`, { method: 'POST' }),

  getStats: () =>
    apiFetch<QueueStats>('/jobs/stats'),

  clearCompleted: () =>
    apiFetch<{ cleared: number }>('/jobs/completed', { method: 'DELETE' }),

  renderComposite: (id: string) =>
    apiFetch<PrintJob>(`/jobs/${id}/render`, { method: 'POST' }),

  getCompositeUrl: (id: string) =>
    `${API_BASE}/jobs/${id}/composite`,

  print: (id: string, options?: { printerName?: string; copies?: number }) =>
    apiFetch<{ jobId: string; status: string; message: string }>(`/jobs/${id}/print`, {
      method: 'POST',
      body: JSON.stringify(options || {}),
    }),

  createEventSource: () =>
    new EventSource(`${API_BASE}/jobs/stream`),
};

// ==================== Paper Size API ====================

export const paperApi = {
  list: () => apiFetch<PaperSize[]>('/paper-sizes'),
};

// ==================== Printer API ====================

export const printerApi = {
  list: () => apiFetch<Printer[]>('/printers'),
};
