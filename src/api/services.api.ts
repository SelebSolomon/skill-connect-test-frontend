import { api } from './axios';
import type { Service } from '../types';

export interface CreateServiceDto {
  name: string;
  category: string;
  description?: string;
  tags?: string[];
}

export interface UpdateServiceDto {
  name?: string;
  category?: string;
  description?: string;
  tags?: string[];
  isActive?: boolean;
}

export const servicesApi = {
  getAll: (category?: string, search?: string): Promise<Service[]> =>
    api.get('/services', { params: { category, search } }).then((r) => r.data),

  getCategories: (): Promise<string[]> =>
    api.get('/services/categories').then((r) => r.data),

  getBySlug: (slug: string): Promise<Service> =>
    api.get(`/services/${slug}`).then((r) => r.data),

  // ─── Admin ───────────────────────────────────────────────────────────────────

  /** Admin: get all services including inactive ones */
  getAllAdmin: (): Promise<Service[]> =>
    api.get('/services/admin/all').then((r) => r.data),

  /** Admin: create a new service */
  create: (dto: CreateServiceDto): Promise<Service> =>
    api.post('/services', dto).then((r) => r.data),

  /** Admin: update a service */
  update: (id: string, dto: UpdateServiceDto): Promise<Service> =>
    api.patch(`/services/${id}`, dto).then((r) => r.data),

  /** Admin: delete a service */
  delete: (id: string): Promise<{ message: string }> =>
    api.delete(`/services/${id}`).then((r) => r.data),

  /** Admin: seed default services */
  seed: (): Promise<{ message: string }> =>
    api.post('/services/seed').then((r) => r.data),
};
