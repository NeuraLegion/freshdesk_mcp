/**
 * Freshdesk API Client
 * Handles all HTTP communication with the Freshdesk API
 */

export interface FreshdeskConfig {
  domain: string;  // e.g., "yourcompany" for yourcompany.freshdesk.com
  apiKey: string;
}

// ==================== TICKETS ====================

export interface Ticket {
  id: number;
  subject: string;
  description?: string;
  description_text?: string;
  status: number;
  priority: number;
  source: number;
  requester_id: number;
  responder_id?: number;
  group_id?: number;
  type?: string;
  due_by?: string;
  fr_due_by?: string;
  is_escalated: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
  custom_fields?: Record<string, unknown>;
}

export interface CreateTicketParams {
  subject: string;
  description: string;
  email?: string;
  requester_id?: number;
  priority?: 1 | 2 | 3 | 4;
  status?: 2 | 3 | 4 | 5;
  source?: number;
  type?: string;
  group_id?: number;
  responder_id?: number;
  tags?: string[];
  custom_fields?: Record<string, unknown>;
}

export interface ListTicketsParams {
  filter?: 'new_and_my_open' | 'watching' | 'spam' | 'deleted';
  requester_id?: number;
  email?: string;
  company_id?: number;
  updated_since?: string;
  order_by?: 'created_at' | 'due_by' | 'updated_at' | 'status';
  order_type?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

// ==================== CONTACTS ====================

export interface Contact {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  twitter_id?: string;
  address?: string;
  description?: string;
  job_title?: string;
  language?: string;
  time_zone?: string;
  company_id?: number;
  active: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
  custom_fields?: Record<string, unknown>;
}

export interface CreateContactParams {
  name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  twitter_id?: string;
  address?: string;
  description?: string;
  job_title?: string;
  language?: string;
  time_zone?: string;
  company_id?: number;
  tags?: string[];
  custom_fields?: Record<string, unknown>;
}

export interface UpdateContactParams extends Partial<CreateContactParams> {}

// ==================== CONVERSATIONS ====================

export interface Conversation {
  id: number;
  body: string;
  body_text?: string;
  incoming: boolean;
  private: boolean;
  user_id: number;
  support_email?: string;
  source: number;
  ticket_id: number;
  created_at: string;
  updated_at: string;
  attachments: unknown[];
}

export interface ReplyParams {
  body: string;
  cc_emails?: string[];
  bcc_emails?: string[];
}

export interface NoteParams {
  body: string;
  private?: boolean;
  incoming?: boolean;
  notify_emails?: string[];
}

// ==================== AGENTS ====================

export interface Agent {
  id: number;
  name: string;
  email: string;
  phone?: string;
  mobile?: string;
  active: boolean;
  occasional: boolean;
  job_title?: string;
  language?: string;
  time_zone?: string;
  group_ids: number[];
  role_ids: number[];
  skill_ids?: number[];
  ticket_scope: number;
  available: boolean;
  available_since?: string;
  signature?: string;
  created_at: string;
  updated_at: string;
  contact: Contact;
}

// ==================== GROUPS ====================

export interface Group {
  id: number;
  name: string;
  description?: string;
  escalate_to?: number;
  unassigned_for?: string;
  business_hour_id?: number;
  group_type?: string;
  agent_ids?: number[];
  created_at: string;
  updated_at: string;
}

// ==================== COMPANIES ====================

export interface Company {
  id: number;
  name: string;
  description?: string;
  note?: string;
  domains: string[];
  health_score?: string;
  account_tier?: string;
  renewal_date?: string;
  industry?: string;
  created_at: string;
  updated_at: string;
  custom_fields?: Record<string, unknown>;
}

export interface CreateCompanyParams {
  name: string;
  description?: string;
  note?: string;
  domains?: string[];
  health_score?: string;
  account_tier?: string;
  renewal_date?: string;
  industry?: string;
  custom_fields?: Record<string, unknown>;
}

export interface UpdateCompanyParams extends Partial<CreateCompanyParams> {}

// ==================== TIME ENTRIES ====================

export interface TimeEntry {
  id: number;
  billable: boolean;
  note?: string;
  timer_running: boolean;
  agent_id: number;
  ticket_id: number;
  time_spent: string;  // Format: "hh:mm"
  executed_at: string;
  start_time?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTimeEntryParams {
  agent_id?: number;
  billable?: boolean;
  note?: string;
  time_spent: string;  // Format: "hh:mm"
  executed_at?: string;
}

// ==================== CANNED RESPONSES ====================

export interface CannedResponseFolder {
  id: number;
  name: string;
  responses_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CannedResponse {
  id: number;
  title: string;
  content: string;
  content_html?: string;
  folder_id: number;
  visibility?: number;
  created_at: string;
  updated_at: string;
}

// ==================== SOLUTIONS (KNOWLEDGE BASE) ====================

export interface SolutionCategory {
  id: number;
  name: string;
  description?: string;
  visible_in_portals?: number[];
  created_at: string;
  updated_at: string;
}

export interface SolutionFolder {
  id: number;
  name: string;
  description?: string;
  visibility: number;
  category_id: number;
  created_at: string;
  updated_at: string;
}

export interface SolutionArticle {
  id: number;
  title: string;
  description?: string;
  description_text?: string;
  status: number;
  folder_id: number;
  category_id: number;
  thumbs_up: number;
  thumbs_down: number;
  hits: number;
  tags: string[];
  seo_data?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ==================== SATISFACTION RATINGS ====================

export interface SatisfactionRating {
  id: number;
  survey_id: number;
  ticket_id: number;
  user_id: number;
  agent_id?: number;
  group_id?: number;
  ratings: Record<string, unknown>;
  feedback?: string;
  created_at: string;
  updated_at: string;
}

// ==================== TICKET FIELDS ====================

export interface TicketField {
  id: number;
  name: string;
  label: string;
  label_for_customers?: string;
  description?: string;
  type: string;
  default: boolean;
  required_for_closure: boolean;
  required_for_agents: boolean;
  required_for_customers: boolean;
  customers_can_edit: boolean;
  displayed_to_customers: boolean;
  position: number;
  choices?: string[] | Record<string, unknown>[];
  created_at: string;
  updated_at: string;
}

// ==================== PRODUCTS ====================

export interface Product {
  id: number;
  name: string;
  description?: string;
  primary_email?: string;
  created_at: string;
  updated_at: string;
}

// ==================== BUSINESS HOURS ====================

export interface BusinessHour {
  id: number;
  name: string;
  description?: string;
  is_default: boolean;
  time_zone: string;
  business_hours: Record<string, unknown>;
  list_of_holidays?: unknown[];
  created_at: string;
  updated_at: string;
}

// ==================== SLA POLICIES ====================

export interface SLAPolicy {
  id: number;
  name: string;
  description?: string;
  is_default: boolean;
  position: number;
  applicable_to?: Record<string, unknown>;
  sla_targets?: Record<string, unknown>[];
  escalation?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ==================== ROLES ====================

export interface Role {
  id: number;
  name: string;
  description?: string;
  default: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== CLIENT CLASS ====================

export class FreshdeskClient {
  private baseUrl: string;
  private authHeader: string;

  constructor(config: FreshdeskConfig) {
    this.baseUrl = `https://${config.domain}.freshdesk.com/api/v2`;
    this.authHeader = 'Basic ' + Buffer.from(`${config.apiKey}:X`).toString('base64');
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Authorization': this.authHeader,
      'Content-Type': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Freshdesk API error (${response.status}): ${errorText}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json() as Promise<T>;
  }

  // ==================== TICKETS ====================

  async listTickets(params?: ListTicketsParams): Promise<Ticket[]> {
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.filter) queryParams.set('filter', params.filter);
      if (params.requester_id) queryParams.set('requester_id', params.requester_id.toString());
      if (params.email) queryParams.set('email', params.email);
      if (params.company_id) queryParams.set('company_id', params.company_id.toString());
      if (params.updated_since) queryParams.set('updated_since', params.updated_since);
      if (params.order_by) queryParams.set('order_by', params.order_by);
      if (params.order_type) queryParams.set('order_type', params.order_type);
      if (params.page) queryParams.set('page', params.page.toString());
      if (params.per_page) queryParams.set('per_page', params.per_page.toString());
    }

    const query = queryParams.toString();
    const endpoint = query ? `/tickets?${query}` : '/tickets';

    return this.request<Ticket[]>('GET', endpoint);
  }

  async viewTicket(ticketId: number, include?: string[]): Promise<Ticket> {
    const queryParams = new URLSearchParams();
    if (include && include.length > 0) {
      queryParams.set('include', include.join(','));
    }

    const query = queryParams.toString();
    const endpoint = query ? `/tickets/${ticketId}?${query}` : `/tickets/${ticketId}`;

    return this.request<Ticket>('GET', endpoint);
  }

  async createTicket(params: CreateTicketParams): Promise<Ticket> {
    return this.request<Ticket>('POST', '/tickets', params);
  }

  async searchTickets(query: string): Promise<{ results: Ticket[]; total: number }> {
    const encodedQuery = encodeURIComponent(query);
    return this.request<{ results: Ticket[]; total: number }>(
      'GET',
      `/search/tickets?query="${encodedQuery}"`
    );
  }

  async updateTicket(ticketId: number, params: Partial<CreateTicketParams>): Promise<Ticket> {
    return this.request<Ticket>('PUT', `/tickets/${ticketId}`, params);
  }

  // ==================== CONVERSATIONS ====================

  async listConversations(ticketId: number): Promise<Conversation[]> {
    return this.request<Conversation[]>('GET', `/tickets/${ticketId}/conversations`);
  }

  async replyToTicket(ticketId: number, params: ReplyParams): Promise<Conversation> {
    return this.request<Conversation>('POST', `/tickets/${ticketId}/reply`, params);
  }

  async addNote(ticketId: number, params: NoteParams): Promise<Conversation> {
    return this.request<Conversation>('POST', `/tickets/${ticketId}/notes`, params);
  }

  // ==================== CONTACTS ====================

  async viewContact(contactId: number): Promise<Contact> {
    return this.request<Contact>('GET', `/contacts/${contactId}`);
  }

  async createContact(params: CreateContactParams): Promise<Contact> {
    return this.request<Contact>('POST', '/contacts', params);
  }

  async updateContact(contactId: number, params: UpdateContactParams): Promise<Contact> {
    return this.request<Contact>('PUT', `/contacts/${contactId}`, params);
  }

  async listContacts(params?: { page?: number; per_page?: number; email?: string; phone?: string; company_id?: number }): Promise<Contact[]> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.per_page) queryParams.set('per_page', params.per_page.toString());
    if (params?.email) queryParams.set('email', params.email);
    if (params?.phone) queryParams.set('phone', params.phone);
    if (params?.company_id) queryParams.set('company_id', params.company_id.toString());

    const query = queryParams.toString();
    const endpoint = query ? `/contacts?${query}` : '/contacts';

    return this.request<Contact[]>('GET', endpoint);
  }

  async searchContacts(query: string): Promise<{ results: Contact[]; total: number }> {
    const encodedQuery = encodeURIComponent(query);
    return this.request<{ results: Contact[]; total: number }>(
      'GET',
      `/search/contacts?query="${encodedQuery}"`
    );
  }

  // ==================== AGENTS ====================

  async listAgents(params?: { page?: number; per_page?: number; email?: string }): Promise<Agent[]> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.per_page) queryParams.set('per_page', params.per_page.toString());
    if (params?.email) queryParams.set('email', params.email);

    const query = queryParams.toString();
    const endpoint = query ? `/agents?${query}` : '/agents';

    return this.request<Agent[]>('GET', endpoint);
  }

  async viewAgent(agentId: number): Promise<Agent> {
    return this.request<Agent>('GET', `/agents/${agentId}`);
  }

  async getCurrentAgent(): Promise<Agent> {
    return this.request<Agent>('GET', '/agents/me');
  }

  // ==================== GROUPS ====================

  async listGroups(): Promise<Group[]> {
    return this.request<Group[]>('GET', '/groups');
  }

  async viewGroup(groupId: number): Promise<Group> {
    return this.request<Group>('GET', `/groups/${groupId}`);
  }

  // ==================== COMPANIES ====================

  async listCompanies(params?: { page?: number; per_page?: number }): Promise<Company[]> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.per_page) queryParams.set('per_page', params.per_page.toString());

    const query = queryParams.toString();
    const endpoint = query ? `/companies?${query}` : '/companies';

    return this.request<Company[]>('GET', endpoint);
  }

  async viewCompany(companyId: number): Promise<Company> {
    return this.request<Company>('GET', `/companies/${companyId}`);
  }

  async createCompany(params: CreateCompanyParams): Promise<Company> {
    return this.request<Company>('POST', '/companies', params);
  }

  async updateCompany(companyId: number, params: UpdateCompanyParams): Promise<Company> {
    return this.request<Company>('PUT', `/companies/${companyId}`, params);
  }

  async searchCompanies(query: string): Promise<{ results: Company[]; total: number }> {
    const encodedQuery = encodeURIComponent(query);
    return this.request<{ results: Company[]; total: number }>(
      'GET',
      `/search/companies?query="${encodedQuery}"`
    );
  }

  // ==================== TIME ENTRIES ====================

  async listTimeEntries(ticketId: number): Promise<TimeEntry[]> {
    return this.request<TimeEntry[]>('GET', `/tickets/${ticketId}/time_entries`);
  }

  async createTimeEntry(ticketId: number, params: CreateTimeEntryParams): Promise<TimeEntry> {
    return this.request<TimeEntry>('POST', `/tickets/${ticketId}/time_entries`, params);
  }

  async updateTimeEntry(entryId: number, params: Partial<CreateTimeEntryParams>): Promise<TimeEntry> {
    return this.request<TimeEntry>('PUT', `/time_entries/${entryId}`, params);
  }

  async toggleTimer(entryId: number): Promise<TimeEntry> {
    return this.request<TimeEntry>('PUT', `/time_entries/${entryId}/toggle_timer`);
  }

  // ==================== CANNED RESPONSES ====================

  async listCannedResponseFolders(): Promise<CannedResponseFolder[]> {
    return this.request<CannedResponseFolder[]>('GET', '/canned_response_folders');
  }

  async listCannedResponses(folderId: number): Promise<CannedResponse[]> {
    return this.request<CannedResponse[]>('GET', `/canned_response_folders/${folderId}/responses`);
  }

  async viewCannedResponse(responseId: number): Promise<CannedResponse> {
    return this.request<CannedResponse>('GET', `/canned_responses/${responseId}`);
  }

  // ==================== SOLUTIONS (KNOWLEDGE BASE) ====================

  async listSolutionCategories(): Promise<SolutionCategory[]> {
    return this.request<SolutionCategory[]>('GET', '/solutions/categories');
  }

  async listSolutionFolders(categoryId: number): Promise<SolutionFolder[]> {
    return this.request<SolutionFolder[]>('GET', `/solutions/categories/${categoryId}/folders`);
  }

  async listSolutionArticles(folderId: number): Promise<SolutionArticle[]> {
    return this.request<SolutionArticle[]>('GET', `/solutions/folders/${folderId}/articles`);
  }

  async viewSolutionArticle(articleId: number): Promise<SolutionArticle> {
    return this.request<SolutionArticle>('GET', `/solutions/articles/${articleId}`);
  }

  async searchSolutions(query: string): Promise<SolutionArticle[]> {
    const encodedQuery = encodeURIComponent(query);
    return this.request<SolutionArticle[]>('GET', `/search/solutions?term=${encodedQuery}`);
  }

  // ==================== SATISFACTION RATINGS ====================

  async listSatisfactionRatings(ticketId: number): Promise<SatisfactionRating[]> {
    return this.request<SatisfactionRating[]>('GET', `/tickets/${ticketId}/satisfaction_ratings`);
  }

  async viewAllSatisfactionRatings(params?: { page?: number; per_page?: number; created_since?: string }): Promise<SatisfactionRating[]> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.per_page) queryParams.set('per_page', params.per_page.toString());
    if (params?.created_since) queryParams.set('created_since', params.created_since);

    const query = queryParams.toString();
    const endpoint = query ? `/surveys/satisfaction_ratings?${query}` : '/surveys/satisfaction_ratings';

    return this.request<SatisfactionRating[]>('GET', endpoint);
  }

  // ==================== TICKET FIELDS ====================

  async listTicketFields(): Promise<TicketField[]> {
    return this.request<TicketField[]>('GET', '/ticket_fields');
  }

  async viewTicketField(fieldId: number): Promise<TicketField> {
    return this.request<TicketField>('GET', `/ticket_fields/${fieldId}`);
  }

  // ==================== PRODUCTS ====================

  async listProducts(): Promise<Product[]> {
    return this.request<Product[]>('GET', '/products');
  }

  async viewProduct(productId: number): Promise<Product> {
    return this.request<Product>('GET', `/products/${productId}`);
  }

  // ==================== BUSINESS HOURS ====================

  async listBusinessHours(): Promise<BusinessHour[]> {
    return this.request<BusinessHour[]>('GET', '/business_hours');
  }

  async viewBusinessHour(businessHourId: number): Promise<BusinessHour> {
    return this.request<BusinessHour>('GET', `/business_hours/${businessHourId}`);
  }

  // ==================== SLA POLICIES ====================

  async listSLAPolicies(): Promise<SLAPolicy[]> {
    return this.request<SLAPolicy[]>('GET', '/sla_policies');
  }

  async viewSLAPolicy(policyId: number): Promise<SLAPolicy> {
    return this.request<SLAPolicy>('GET', `/sla_policies/${policyId}`);
  }

  // ==================== ROLES ====================

  async listRoles(): Promise<Role[]> {
    return this.request<Role[]>('GET', '/roles');
  }

  async viewRole(roleId: number): Promise<Role> {
    return this.request<Role>('GET', `/roles/${roleId}`);
  }
}
