#!/usr/bin/env node

/**
 * Freshdesk MCP Server
 * Provides MCP tools for interacting with the Freshdesk API
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  FreshdeskClient,
  type CreateTicketParams,
  type UpdateContactParams,
  type CreateContactParams,
  type ReplyParams,
  type NoteParams,
  type ListTicketsParams,
  type CreateCompanyParams,
  type UpdateCompanyParams,
  type CreateTimeEntryParams,
} from './freshdesk-client.js';

// Get configuration from environment variables
const FRESHDESK_DOMAIN = process.env.FRESHDESK_DOMAIN;
const FRESHDESK_API_KEY = process.env.FRESHDESK_API_KEY;

if (!FRESHDESK_DOMAIN || !FRESHDESK_API_KEY) {
  console.error('Error: FRESHDESK_DOMAIN and FRESHDESK_API_KEY environment variables are required');
  process.exit(1);
}

const client = new FreshdeskClient({
  domain: FRESHDESK_DOMAIN,
  apiKey: FRESHDESK_API_KEY,
});

// Status and priority mappings
const STATUS_MAP: Record<number, string> = {
  2: 'Open',
  3: 'Pending',
  4: 'Resolved',
  5: 'Closed',
};

const PRIORITY_MAP: Record<number, string> = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
  4: 'Urgent',
};

const SOURCE_MAP: Record<number, string> = {
  1: 'Email',
  2: 'Portal',
  3: 'Phone',
  7: 'Chat',
  9: 'Feedback Widget',
  10: 'Outbound Email',
};

// Helper formatters
function formatTicket(ticket: Record<string, unknown>): string {
  const status = STATUS_MAP[ticket.status as number] || ticket.status;
  const priority = PRIORITY_MAP[ticket.priority as number] || ticket.priority;
  const source = SOURCE_MAP[ticket.source as number] || ticket.source;

  return `
Ticket #${ticket.id}
Subject: ${ticket.subject}
Status: ${status}
Priority: ${priority}
Source: ${source}
Requester ID: ${ticket.requester_id}
${ticket.responder_id ? `Assigned Agent ID: ${ticket.responder_id}` : 'Unassigned'}
${ticket.group_id ? `Group ID: ${ticket.group_id}` : ''}
Created: ${ticket.created_at}
Updated: ${ticket.updated_at}
${ticket.tags && (ticket.tags as string[]).length > 0 ? `Tags: ${(ticket.tags as string[]).join(', ')}` : ''}
${ticket.description_text ? `\nDescription:\n${ticket.description_text}` : ''}
`.trim();
}

function formatContact(contact: Record<string, unknown>): string {
  return `
Contact #${contact.id}
Name: ${contact.name}
Email: ${contact.email || 'N/A'}
Phone: ${contact.phone || 'N/A'}
Mobile: ${contact.mobile || 'N/A'}
Company ID: ${contact.company_id || 'N/A'}
Job Title: ${contact.job_title || 'N/A'}
Active: ${contact.active}
Created: ${contact.created_at}
${contact.tags && (contact.tags as string[]).length > 0 ? `Tags: ${(contact.tags as string[]).join(', ')}` : ''}
${contact.description ? `\nDescription:\n${contact.description}` : ''}
`.trim();
}

function formatAgent(agent: Record<string, unknown>): string {
  return `
Agent #${agent.id}
Name: ${agent.name}
Email: ${agent.email}
Phone: ${agent.phone || 'N/A'}
Active: ${agent.active}
Available: ${agent.available}
Job Title: ${agent.job_title || 'N/A'}
Groups: ${(agent.group_ids as number[])?.join(', ') || 'None'}
Created: ${agent.created_at}
`.trim();
}

function formatGroup(group: Record<string, unknown>): string {
  return `
Group #${group.id}
Name: ${group.name}
Description: ${group.description || 'N/A'}
Agent IDs: ${(group.agent_ids as number[])?.join(', ') || 'None'}
Created: ${group.created_at}
`.trim();
}

function formatCompany(company: Record<string, unknown>): string {
  return `
Company #${company.id}
Name: ${company.name}
Description: ${company.description || 'N/A'}
Domains: ${(company.domains as string[])?.join(', ') || 'N/A'}
Industry: ${company.industry || 'N/A'}
Health Score: ${company.health_score || 'N/A'}
Created: ${company.created_at}
`.trim();
}

function formatConversation(conv: Record<string, unknown>): string {
  const type = conv.private ? 'Private Note' : (conv.incoming ? 'Customer Reply' : 'Agent Reply');
  return `
[${type}] ID: ${conv.id}
From User ID: ${conv.user_id}
Created: ${conv.created_at}
${conv.body_text || conv.body}
---`;
}

function formatTimeEntry(entry: Record<string, unknown>): string {
  return `
Time Entry #${entry.id}
Agent ID: ${entry.agent_id}
Time Spent: ${entry.time_spent}
Billable: ${entry.billable}
Timer Running: ${entry.timer_running}
Note: ${entry.note || 'N/A'}
Executed At: ${entry.executed_at}
`.trim();
}

// Create MCP server
const server = new McpServer({
  name: 'freshdesk-mcp-server',
  version: '1.0.0',
});

// ==================== PHASE 1: CORE TICKET OPERATIONS ====================

// 1. List Tickets
server.tool(
  'list_tickets',
  'List all tickets from Freshdesk with optional filters.',
  {
    filter: z.enum(['new_and_my_open', 'watching', 'spam', 'deleted']).optional()
      .describe('Predefined filter'),
    requester_id: z.number().optional().describe('Filter by requester ID'),
    email: z.string().optional().describe('Filter by requester email'),
    company_id: z.number().optional().describe('Filter by company ID'),
    updated_since: z.string().optional().describe('Filter by update date (ISO format)'),
    order_by: z.enum(['created_at', 'due_by', 'updated_at', 'status']).optional(),
    order_type: z.enum(['asc', 'desc']).optional(),
    page: z.number().optional(),
    per_page: z.number().optional(),
  },
  async (params) => {
    try {
      const tickets = await client.listTickets(params as ListTicketsParams);
      if (tickets.length === 0) {
        return { content: [{ type: 'text', text: 'No tickets found.' }] };
      }
      const summary = tickets.map((t) => {
        const status = STATUS_MAP[t.status] || t.status;
        const priority = PRIORITY_MAP[t.priority] || t.priority;
        return `#${t.id} | ${status} | ${priority} | ${t.subject}`;
      }).join('\n');
      return { content: [{ type: 'text', text: `Found ${tickets.length} ticket(s):\n\n${summary}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// 2. View Ticket
server.tool(
  'view_ticket',
  'View detailed information about a specific ticket.',
  {
    ticket_id: z.number().describe('The ticket ID'),
    include: z.array(z.enum(['conversations', 'requester', 'company', 'stats'])).optional(),
  },
  async ({ ticket_id, include }) => {
    try {
      const ticket = await client.viewTicket(ticket_id, include);
      return { content: [{ type: 'text', text: formatTicket(ticket as unknown as Record<string, unknown>) }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// 3. Create Ticket
server.tool(
  'create_ticket',
  'Create a new support ticket. Requires subject, description, and email or requester_id.',
  {
    subject: z.string().describe('Ticket subject'),
    description: z.string().describe('HTML description'),
    email: z.string().optional().describe('Requester email'),
    requester_id: z.number().optional().describe('Existing requester ID'),
    priority: z.enum(['1', '2', '3', '4']).optional().describe('1=Low, 2=Medium, 3=High, 4=Urgent'),
    status: z.enum(['2', '3', '4', '5']).optional().describe('2=Open, 3=Pending, 4=Resolved, 5=Closed'),
    type: z.string().optional().describe('Ticket type'),
    group_id: z.number().optional(),
    responder_id: z.number().optional(),
    tags: z.array(z.string()).optional(),
  },
  async (params) => {
    try {
      if (!params.email && !params.requester_id) {
        return { content: [{ type: 'text', text: 'Error: email or requester_id required.' }], isError: true };
      }
      const createParams: CreateTicketParams = {
        subject: params.subject,
        description: params.description,
        email: params.email,
        requester_id: params.requester_id,
        priority: params.priority ? parseInt(params.priority) as 1 | 2 | 3 | 4 : undefined,
        status: params.status ? parseInt(params.status) as 2 | 3 | 4 | 5 : undefined,
        type: params.type,
        group_id: params.group_id,
        responder_id: params.responder_id,
        tags: params.tags,
      };
      const ticket = await client.createTicket(createParams);
      return { content: [{ type: 'text', text: `Ticket created!\n\n${formatTicket(ticket as unknown as Record<string, unknown>)}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// 4. Search Tickets
server.tool(
  'search_tickets',
  'Search tickets using Freshdesk query syntax.',
  {
    query: z.string().describe('Query: "status:2", "priority:4", "(status:2 OR status:3) AND priority:4"'),
  },
  async ({ query }) => {
    try {
      const result = await client.searchTickets(query);
      if (result.results.length === 0) {
        return { content: [{ type: 'text', text: `No tickets found for: ${query}` }] };
      }
      const summary = result.results.map((t) => {
        const status = STATUS_MAP[t.status] || t.status;
        const priority = PRIORITY_MAP[t.priority] || t.priority;
        return `#${t.id} | ${status} | ${priority} | ${t.subject}`;
      }).join('\n');
      return { content: [{ type: 'text', text: `Found ${result.total} ticket(s):\n\n${summary}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// 5. Update Ticket
server.tool(
  'update_ticket',
  'Update a ticket (status, priority, assignee, etc.).',
  {
    ticket_id: z.number().describe('Ticket ID'),
    subject: z.string().optional(),
    description: z.string().optional(),
    priority: z.enum(['1', '2', '3', '4']).optional(),
    status: z.enum(['2', '3', '4', '5']).optional(),
    type: z.string().optional(),
    group_id: z.number().optional(),
    responder_id: z.number().optional(),
    tags: z.array(z.string()).optional(),
  },
  async ({ ticket_id, ...params }) => {
    try {
      const updateParams: Partial<CreateTicketParams> = {};
      if (params.subject) updateParams.subject = params.subject;
      if (params.description) updateParams.description = params.description;
      if (params.priority) updateParams.priority = parseInt(params.priority) as 1 | 2 | 3 | 4;
      if (params.status) updateParams.status = parseInt(params.status) as 2 | 3 | 4 | 5;
      if (params.type) updateParams.type = params.type;
      if (params.group_id) updateParams.group_id = params.group_id;
      if (params.responder_id) updateParams.responder_id = params.responder_id;
      if (params.tags) updateParams.tags = params.tags;

      const ticket = await client.updateTicket(ticket_id, updateParams);
      return { content: [{ type: 'text', text: `Ticket updated!\n\n${formatTicket(ticket as unknown as Record<string, unknown>)}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// 6. Reply to Ticket
server.tool(
  'reply_to_ticket',
  'Send a public reply to a ticket (emails the customer).',
  {
    ticket_id: z.number().describe('Ticket ID'),
    body: z.string().describe('HTML reply body'),
    cc_emails: z.array(z.string()).optional(),
    bcc_emails: z.array(z.string()).optional(),
  },
  async ({ ticket_id, body, cc_emails, bcc_emails }) => {
    try {
      const replyParams: ReplyParams = { body };
      if (cc_emails) replyParams.cc_emails = cc_emails;
      if (bcc_emails) replyParams.bcc_emails = bcc_emails;
      const conv = await client.replyToTicket(ticket_id, replyParams);
      return { content: [{ type: 'text', text: `Reply sent to ticket #${ticket_id}!\nConversation ID: ${conv.id}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// 7. Add Note to Ticket
server.tool(
  'add_note_to_ticket',
  'Add a note to a ticket (private or public).',
  {
    ticket_id: z.number().describe('Ticket ID'),
    body: z.string().describe('HTML note body'),
    private: z.boolean().optional().default(true).describe('Private note (default true)'),
    notify_emails: z.array(z.string()).optional(),
  },
  async ({ ticket_id, body, private: isPrivate, notify_emails }) => {
    try {
      const noteParams: NoteParams = { body, private: isPrivate ?? true };
      if (notify_emails) noteParams.notify_emails = notify_emails;
      const conv = await client.addNote(ticket_id, noteParams);
      return { content: [{ type: 'text', text: `Note added to ticket #${ticket_id}!\nNote ID: ${conv.id}, Private: ${conv.private}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// 8. View Contact
server.tool(
  'view_contact',
  'View detailed information about a contact.',
  {
    contact_id: z.number().describe('Contact ID'),
  },
  async ({ contact_id }) => {
    try {
      const contact = await client.viewContact(contact_id);
      return { content: [{ type: 'text', text: formatContact(contact as unknown as Record<string, unknown>) }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// 9. Update Contact
server.tool(
  'update_contact',
  'Update a contact\'s information.',
  {
    contact_id: z.number().describe('Contact ID'),
    name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    mobile: z.string().optional(),
    address: z.string().optional(),
    description: z.string().optional(),
    job_title: z.string().optional(),
    company_id: z.number().optional(),
    tags: z.array(z.string()).optional(),
  },
  async ({ contact_id, ...params }) => {
    try {
      const updateParams: UpdateContactParams = {};
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) (updateParams as Record<string, unknown>)[key] = value;
      });
      const contact = await client.updateContact(contact_id, updateParams);
      return { content: [{ type: 'text', text: `Contact updated!\n\n${formatContact(contact as unknown as Record<string, unknown>)}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// ==================== PHASE 2: ENHANCED SUPPORT ====================

// 10. List Ticket Conversations
server.tool(
  'list_ticket_conversations',
  'Get all conversations (replies and notes) for a ticket.',
  {
    ticket_id: z.number().describe('Ticket ID'),
  },
  async ({ ticket_id }) => {
    try {
      const conversations = await client.listConversations(ticket_id);
      if (conversations.length === 0) {
        return { content: [{ type: 'text', text: `No conversations found for ticket #${ticket_id}` }] };
      }
      const formatted = conversations.map(c => formatConversation(c as unknown as Record<string, unknown>)).join('\n');
      return { content: [{ type: 'text', text: `Conversations for ticket #${ticket_id}:\n\n${formatted}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// 11. List Contacts
server.tool(
  'list_contacts',
  'List all contacts with optional filters.',
  {
    email: z.string().optional().describe('Filter by email'),
    phone: z.string().optional().describe('Filter by phone'),
    company_id: z.number().optional().describe('Filter by company'),
    page: z.number().optional(),
    per_page: z.number().optional(),
  },
  async (params) => {
    try {
      const contacts = await client.listContacts(params);
      if (contacts.length === 0) {
        return { content: [{ type: 'text', text: 'No contacts found.' }] };
      }
      const summary = contacts.map(c => `#${c.id} | ${c.name} | ${c.email || 'N/A'} | ${c.phone || 'N/A'}`).join('\n');
      return { content: [{ type: 'text', text: `Found ${contacts.length} contact(s):\n\n${summary}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// 12. Search Contacts
server.tool(
  'search_contacts',
  'Search contacts using query syntax.',
  {
    query: z.string().describe('Query: "email:john@example.com", "name:John"'),
  },
  async ({ query }) => {
    try {
      const result = await client.searchContacts(query);
      if (result.results.length === 0) {
        return { content: [{ type: 'text', text: `No contacts found for: ${query}` }] };
      }
      const summary = result.results.map(c => `#${c.id} | ${c.name} | ${c.email || 'N/A'}`).join('\n');
      return { content: [{ type: 'text', text: `Found ${result.total} contact(s):\n\n${summary}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// 13. Create Contact
server.tool(
  'create_contact',
  'Create a new contact.',
  {
    name: z.string().describe('Contact name'),
    email: z.string().optional(),
    phone: z.string().optional(),
    mobile: z.string().optional(),
    address: z.string().optional(),
    description: z.string().optional(),
    job_title: z.string().optional(),
    company_id: z.number().optional(),
    tags: z.array(z.string()).optional(),
  },
  async (params) => {
    try {
      const createParams: CreateContactParams = {
        name: params.name,
        email: params.email,
        phone: params.phone,
        mobile: params.mobile,
        address: params.address,
        description: params.description,
        job_title: params.job_title,
        company_id: params.company_id,
        tags: params.tags,
      };
      const contact = await client.createContact(createParams);
      return { content: [{ type: 'text', text: `Contact created!\n\n${formatContact(contact as unknown as Record<string, unknown>)}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// 14. List Agents
server.tool(
  'list_agents',
  'List all agents.',
  {
    email: z.string().optional().describe('Filter by email'),
    page: z.number().optional(),
    per_page: z.number().optional(),
  },
  async (params) => {
    try {
      const agents = await client.listAgents(params);
      if (agents.length === 0) {
        return { content: [{ type: 'text', text: 'No agents found.' }] };
      }
      const summary = agents.map(a => `#${a.id} | ${a.name} | ${a.email} | Active: ${a.active} | Available: ${a.available}`).join('\n');
      return { content: [{ type: 'text', text: `Found ${agents.length} agent(s):\n\n${summary}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// 15. View Agent
server.tool(
  'view_agent',
  'View detailed information about an agent.',
  {
    agent_id: z.number().describe('Agent ID'),
  },
  async ({ agent_id }) => {
    try {
      const agent = await client.viewAgent(agent_id);
      return { content: [{ type: 'text', text: formatAgent(agent as unknown as Record<string, unknown>) }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// 16. Get Current Agent
server.tool(
  'get_current_agent',
  'Get the currently authenticated agent.',
  {},
  async () => {
    try {
      const agent = await client.getCurrentAgent();
      return { content: [{ type: 'text', text: formatAgent(agent as unknown as Record<string, unknown>) }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// 17. List Groups
server.tool(
  'list_groups',
  'List all agent groups.',
  {},
  async () => {
    try {
      const groups = await client.listGroups();
      if (groups.length === 0) {
        return { content: [{ type: 'text', text: 'No groups found.' }] };
      }
      const summary = groups.map(g => `#${g.id} | ${g.name} | ${g.description || 'No description'}`).join('\n');
      return { content: [{ type: 'text', text: `Found ${groups.length} group(s):\n\n${summary}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// 18. View Group
server.tool(
  'view_group',
  'View detailed information about a group.',
  {
    group_id: z.number().describe('Group ID'),
  },
  async ({ group_id }) => {
    try {
      const group = await client.viewGroup(group_id);
      return { content: [{ type: 'text', text: formatGroup(group as unknown as Record<string, unknown>) }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// ==================== PHASE 3: POWER FEATURES ====================

// 19. List Companies
server.tool(
  'list_companies',
  'List all companies.',
  {
    page: z.number().optional(),
    per_page: z.number().optional(),
  },
  async (params) => {
    try {
      const companies = await client.listCompanies(params);
      if (companies.length === 0) {
        return { content: [{ type: 'text', text: 'No companies found.' }] };
      }
      const summary = companies.map(c => `#${c.id} | ${c.name} | ${c.domains?.join(', ') || 'No domains'}`).join('\n');
      return { content: [{ type: 'text', text: `Found ${companies.length} company(s):\n\n${summary}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// 20. View Company
server.tool(
  'view_company',
  'View detailed information about a company.',
  {
    company_id: z.number().describe('Company ID'),
  },
  async ({ company_id }) => {
    try {
      const company = await client.viewCompany(company_id);
      return { content: [{ type: 'text', text: formatCompany(company as unknown as Record<string, unknown>) }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// 21. Create Company
server.tool(
  'create_company',
  'Create a new company.',
  {
    name: z.string().describe('Company name'),
    description: z.string().optional(),
    domains: z.array(z.string()).optional().describe('Company domains'),
    industry: z.string().optional(),
    health_score: z.string().optional(),
    account_tier: z.string().optional(),
    note: z.string().optional(),
  },
  async (params) => {
    try {
      const createParams: CreateCompanyParams = {
        name: params.name,
        description: params.description,
        domains: params.domains,
        industry: params.industry,
        health_score: params.health_score,
        account_tier: params.account_tier,
        note: params.note,
      };
      const company = await client.createCompany(createParams);
      return { content: [{ type: 'text', text: `Company created!\n\n${formatCompany(company as unknown as Record<string, unknown>)}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// 22. Update Company
server.tool(
  'update_company',
  'Update a company\'s information.',
  {
    company_id: z.number().describe('Company ID'),
    name: z.string().optional(),
    description: z.string().optional(),
    domains: z.array(z.string()).optional(),
    industry: z.string().optional(),
    health_score: z.string().optional(),
    account_tier: z.string().optional(),
    note: z.string().optional(),
  },
  async ({ company_id, ...params }) => {
    try {
      const updateParams: UpdateCompanyParams = {};
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) (updateParams as Record<string, unknown>)[key] = value;
      });
      const company = await client.updateCompany(company_id, updateParams);
      return { content: [{ type: 'text', text: `Company updated!\n\n${formatCompany(company as unknown as Record<string, unknown>)}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// 23. Search Companies
server.tool(
  'search_companies',
  'Search companies using query syntax.',
  {
    query: z.string().describe('Query: "name:Acme", "domain:acme.com"'),
  },
  async ({ query }) => {
    try {
      const result = await client.searchCompanies(query);
      if (result.results.length === 0) {
        return { content: [{ type: 'text', text: `No companies found for: ${query}` }] };
      }
      const summary = result.results.map(c => `#${c.id} | ${c.name}`).join('\n');
      return { content: [{ type: 'text', text: `Found ${result.total} company(s):\n\n${summary}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// 24. List Time Entries
server.tool(
  'list_time_entries',
  'List all time entries for a ticket.',
  {
    ticket_id: z.number().describe('Ticket ID'),
  },
  async ({ ticket_id }) => {
    try {
      const entries = await client.listTimeEntries(ticket_id);
      if (entries.length === 0) {
        return { content: [{ type: 'text', text: `No time entries for ticket #${ticket_id}` }] };
      }
      const formatted = entries.map(e => formatTimeEntry(e as unknown as Record<string, unknown>)).join('\n\n');
      return { content: [{ type: 'text', text: `Time entries for ticket #${ticket_id}:\n\n${formatted}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// 25. Create Time Entry
server.tool(
  'create_time_entry',
  'Log time on a ticket.',
  {
    ticket_id: z.number().describe('Ticket ID'),
    time_spent: z.string().describe('Time spent in "hh:mm" format'),
    agent_id: z.number().optional().describe('Agent ID (defaults to current)'),
    billable: z.boolean().optional().describe('Is billable'),
    note: z.string().optional().describe('Note about the work'),
    executed_at: z.string().optional().describe('When work was done (ISO format)'),
  },
  async ({ ticket_id, ...params }) => {
    try {
      const createParams: CreateTimeEntryParams = { time_spent: params.time_spent };
      if (params.agent_id) createParams.agent_id = params.agent_id;
      if (params.billable !== undefined) createParams.billable = params.billable;
      if (params.note) createParams.note = params.note;
      if (params.executed_at) createParams.executed_at = params.executed_at;

      const entry = await client.createTimeEntry(ticket_id, createParams);
      return { content: [{ type: 'text', text: `Time entry created!\n\n${formatTimeEntry(entry as unknown as Record<string, unknown>)}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// 26. Toggle Timer
server.tool(
  'toggle_timer',
  'Start or stop a timer on a time entry.',
  {
    time_entry_id: z.number().describe('Time entry ID'),
  },
  async ({ time_entry_id }) => {
    try {
      const entry = await client.toggleTimer(time_entry_id);
      const status = entry.timer_running ? 'started' : 'stopped';
      return { content: [{ type: 'text', text: `Timer ${status}!\n\n${formatTimeEntry(entry as unknown as Record<string, unknown>)}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// 27. List Canned Response Folders
server.tool(
  'list_canned_response_folders',
  'List all canned response folders.',
  {},
  async () => {
    try {
      const folders = await client.listCannedResponseFolders();
      if (folders.length === 0) {
        return { content: [{ type: 'text', text: 'No canned response folders found.' }] };
      }
      const summary = folders.map(f => `#${f.id} | ${f.name} | ${f.responses_count || 0} responses`).join('\n');
      return { content: [{ type: 'text', text: `Found ${folders.length} folder(s):\n\n${summary}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// 28. List Canned Responses
server.tool(
  'list_canned_responses',
  'List canned responses in a folder.',
  {
    folder_id: z.number().describe('Folder ID'),
  },
  async ({ folder_id }) => {
    try {
      const responses = await client.listCannedResponses(folder_id);
      if (responses.length === 0) {
        return { content: [{ type: 'text', text: 'No canned responses in this folder.' }] };
      }
      const summary = responses.map(r => `#${r.id} | ${r.title}`).join('\n');
      return { content: [{ type: 'text', text: `Found ${responses.length} response(s):\n\n${summary}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// 29. View Canned Response
server.tool(
  'view_canned_response',
  'View a canned response\'s content.',
  {
    response_id: z.number().describe('Response ID'),
  },
  async ({ response_id }) => {
    try {
      const response = await client.viewCannedResponse(response_id);
      return { content: [{ type: 'text', text: `Canned Response #${response.id}\nTitle: ${response.title}\n\nContent:\n${response.content}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// 30. List Solution Categories
server.tool(
  'list_solution_categories',
  'List knowledge base categories.',
  {},
  async () => {
    try {
      const categories = await client.listSolutionCategories();
      if (categories.length === 0) {
        return { content: [{ type: 'text', text: 'No solution categories found.' }] };
      }
      const summary = categories.map(c => `#${c.id} | ${c.name} | ${c.description || 'No description'}`).join('\n');
      return { content: [{ type: 'text', text: `Found ${categories.length} category(s):\n\n${summary}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// 31. List Solution Folders
server.tool(
  'list_solution_folders',
  'List folders in a knowledge base category.',
  {
    category_id: z.number().describe('Category ID'),
  },
  async ({ category_id }) => {
    try {
      const folders = await client.listSolutionFolders(category_id);
      if (folders.length === 0) {
        return { content: [{ type: 'text', text: 'No folders in this category.' }] };
      }
      const summary = folders.map(f => `#${f.id} | ${f.name}`).join('\n');
      return { content: [{ type: 'text', text: `Found ${folders.length} folder(s):\n\n${summary}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// 32. List Solution Articles
server.tool(
  'list_solution_articles',
  'List articles in a knowledge base folder.',
  {
    folder_id: z.number().describe('Folder ID'),
  },
  async ({ folder_id }) => {
    try {
      const articles = await client.listSolutionArticles(folder_id);
      if (articles.length === 0) {
        return { content: [{ type: 'text', text: 'No articles in this folder.' }] };
      }
      const summary = articles.map(a => `#${a.id} | ${a.title} | 👍${a.thumbs_up} 👎${a.thumbs_down} | Views: ${a.hits}`).join('\n');
      return { content: [{ type: 'text', text: `Found ${articles.length} article(s):\n\n${summary}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// 33. View Solution Article
server.tool(
  'view_solution_article',
  'View a knowledge base article.',
  {
    article_id: z.number().describe('Article ID'),
  },
  async ({ article_id }) => {
    try {
      const article = await client.viewSolutionArticle(article_id);
      return { content: [{ type: 'text', text: `Article #${article.id}\nTitle: ${article.title}\nViews: ${article.hits} | 👍${article.thumbs_up} 👎${article.thumbs_down}\nTags: ${article.tags?.join(', ') || 'None'}\n\n${article.description_text || article.description}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// 34. Search Solutions
server.tool(
  'search_solutions',
  'Search knowledge base articles.',
  {
    query: z.string().describe('Search term'),
  },
  async ({ query }) => {
    try {
      const articles = await client.searchSolutions(query);
      if (articles.length === 0) {
        return { content: [{ type: 'text', text: `No articles found for: ${query}` }] };
      }
      const summary = articles.map(a => `#${a.id} | ${a.title}`).join('\n');
      return { content: [{ type: 'text', text: `Found ${articles.length} article(s):\n\n${summary}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// 35. List Satisfaction Ratings (for ticket)
server.tool(
  'list_ticket_satisfaction_ratings',
  'List satisfaction ratings for a ticket.',
  {
    ticket_id: z.number().describe('Ticket ID'),
  },
  async ({ ticket_id }) => {
    try {
      const ratings = await client.listSatisfactionRatings(ticket_id);
      if (ratings.length === 0) {
        return { content: [{ type: 'text', text: `No satisfaction ratings for ticket #${ticket_id}` }] };
      }
      const summary = ratings.map(r => `#${r.id} | Rating: ${JSON.stringify(r.ratings)} | Feedback: ${r.feedback || 'None'}`).join('\n');
      return { content: [{ type: 'text', text: `Satisfaction ratings for ticket #${ticket_id}:\n\n${summary}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// 36. List All Satisfaction Ratings
server.tool(
  'list_all_satisfaction_ratings',
  'List all satisfaction ratings across tickets.',
  {
    created_since: z.string().optional().describe('Filter by date (ISO format)'),
    page: z.number().optional(),
    per_page: z.number().optional(),
  },
  async (params) => {
    try {
      const ratings = await client.viewAllSatisfactionRatings(params);
      if (ratings.length === 0) {
        return { content: [{ type: 'text', text: 'No satisfaction ratings found.' }] };
      }
      const summary = ratings.map(r => `Ticket #${r.ticket_id} | Rating: ${JSON.stringify(r.ratings)} | ${r.created_at}`).join('\n');
      return { content: [{ type: 'text', text: `Found ${ratings.length} rating(s):\n\n${summary}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// 37. List Ticket Fields
server.tool(
  'list_ticket_fields',
  'List all custom ticket fields.',
  {},
  async () => {
    try {
      const fields = await client.listTicketFields();
      if (fields.length === 0) {
        return { content: [{ type: 'text', text: 'No ticket fields found.' }] };
      }
      const summary = fields.map(f => `#${f.id} | ${f.name} | ${f.label} | Type: ${f.type} | Required: ${f.required_for_agents}`).join('\n');
      return { content: [{ type: 'text', text: `Found ${fields.length} field(s):\n\n${summary}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// 38. List Products
server.tool(
  'list_products',
  'List all products.',
  {},
  async () => {
    try {
      const products = await client.listProducts();
      if (products.length === 0) {
        return { content: [{ type: 'text', text: 'No products found.' }] };
      }
      const summary = products.map(p => `#${p.id} | ${p.name} | ${p.description || 'No description'}`).join('\n');
      return { content: [{ type: 'text', text: `Found ${products.length} product(s):\n\n${summary}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// 39. List Business Hours
server.tool(
  'list_business_hours',
  'List all business hour configurations.',
  {},
  async () => {
    try {
      const hours = await client.listBusinessHours();
      if (hours.length === 0) {
        return { content: [{ type: 'text', text: 'No business hours found.' }] };
      }
      const summary = hours.map(h => `#${h.id} | ${h.name} | Timezone: ${h.time_zone} | Default: ${h.is_default}`).join('\n');
      return { content: [{ type: 'text', text: `Found ${hours.length} business hour config(s):\n\n${summary}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// 40. List SLA Policies
server.tool(
  'list_sla_policies',
  'List all SLA policies.',
  {},
  async () => {
    try {
      const policies = await client.listSLAPolicies();
      if (policies.length === 0) {
        return { content: [{ type: 'text', text: 'No SLA policies found.' }] };
      }
      const summary = policies.map(p => `#${p.id} | ${p.name} | Default: ${p.is_default} | ${p.description || ''}`).join('\n');
      return { content: [{ type: 'text', text: `Found ${policies.length} SLA policy(s):\n\n${summary}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// 41. List Roles
server.tool(
  'list_roles',
  'List all agent roles.',
  {},
  async () => {
    try {
      const roles = await client.listRoles();
      if (roles.length === 0) {
        return { content: [{ type: 'text', text: 'No roles found.' }] };
      }
      const summary = roles.map(r => `#${r.id} | ${r.name} | Default: ${r.default} | ${r.description || ''}`).join('\n');
      return { content: [{ type: 'text', text: `Found ${roles.length} role(s):\n\n${summary}` }] };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// ==================== START SERVER ====================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Freshdesk MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
