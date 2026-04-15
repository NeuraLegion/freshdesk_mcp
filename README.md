# Freshdesk MCP Server

Developed and maintained by [Bright Security](https://brightsec.com).

An MCP (Model Context Protocol) server for integrating with the Freshdesk API. Provides 41 tools for managing support tickets, contacts, companies, and more.

> **Disclaimer:** This software is provided as-is by Bright Security. Use at your own risk. Bright Security makes no warranties regarding the reliability, accuracy, or completeness of this tool. You are solely responsible for how you use it and for any actions performed through the Freshdesk API. Always review tool actions before executing them in production environments.

## Setup

### 1. Get Your Freshdesk API Key

1. Log in to your Freshdesk account
2. Click on your profile picture → Profile Settings
3. Your API key is displayed on the right side

### 2. Configure Environment Variables

```bash
export FRESHDESK_DOMAIN=yourcompany      # Your subdomain (from yourcompany.freshdesk.com)
export FRESHDESK_API_KEY=your_api_key    # Your API key
```

### 3. Build

```bash
npm install
npm run build
```

### 4. Add to Claude/VSCode Configuration

```json
{
  "mcpServers": {
    "freshdesk": {
      "command": "node",
      "args": ["/path/to/freshdesk_mcp/dist/index.js"],
      "env": {
        "FRESHDESK_DOMAIN": "yourcompany",
        "FRESHDESK_API_KEY": "your_api_key"
      }
    }
  }
}
```

## Available Tools (41 Total)

### Ticket Operations (5 tools)
| Tool | Description |
|------|-------------|
| `list_tickets` | List tickets with filters (status, priority, requester, date) |
| `view_ticket` | View detailed ticket information |
| `create_ticket` | Create a new support ticket |
| `search_tickets` | Search tickets using Freshdesk query syntax |
| `update_ticket` | Update ticket properties |

### Conversation Operations (3 tools)
| Tool | Description |
|------|-------------|
| `list_ticket_conversations` | Get all replies and notes for a ticket |
| `reply_to_ticket` | Send a public reply (emails customer) |
| `add_note_to_ticket` | Add private or public note |

### Contact Operations (5 tools)
| Tool | Description |
|------|-------------|
| `list_contacts` | List all contacts with filters |
| `view_contact` | View contact details |
| `create_contact` | Create a new contact |
| `update_contact` | Update contact information |
| `search_contacts` | Search contacts |

### Agent Operations (4 tools)
| Tool | Description |
|------|-------------|
| `list_agents` | List all agents |
| `view_agent` | View agent details |
| `get_current_agent` | Get authenticated agent info |
| `list_groups` | List all agent groups |
| `view_group` | View group details |

### Company Operations (5 tools)
| Tool | Description |
|------|-------------|
| `list_companies` | List all companies |
| `view_company` | View company details |
| `create_company` | Create a new company |
| `update_company` | Update company information |
| `search_companies` | Search companies |

### Time Tracking (3 tools)
| Tool | Description |
|------|-------------|
| `list_time_entries` | List time entries for a ticket |
| `create_time_entry` | Log time on a ticket |
| `toggle_timer` | Start/stop timer |

### Canned Responses (3 tools)
| Tool | Description |
|------|-------------|
| `list_canned_response_folders` | List response folders |
| `list_canned_responses` | List responses in a folder |
| `view_canned_response` | View response content |

### Knowledge Base (5 tools)
| Tool | Description |
|------|-------------|
| `list_solution_categories` | List KB categories |
| `list_solution_folders` | List folders in category |
| `list_solution_articles` | List articles in folder |
| `view_solution_article` | View article content |
| `search_solutions` | Search knowledge base |

### Satisfaction Ratings (2 tools)
| Tool | Description |
|------|-------------|
| `list_ticket_satisfaction_ratings` | Ratings for a ticket |
| `list_all_satisfaction_ratings` | All ratings |

### System Configuration (5 tools)
| Tool | Description |
|------|-------------|
| `list_ticket_fields` | List custom ticket fields |
| `list_products` | List products |
| `list_business_hours` | List business hour configs |
| `list_sla_policies` | List SLA policies |
| `list_roles` | List agent roles |

## Search Query Syntax

The search tools use Freshdesk's query syntax:

### Ticket Search
- `status:2` - Open, `status:3` - Pending, `status:4` - Resolved, `status:5` - Closed
- `priority:1` - Low, `priority:2` - Medium, `priority:3` - High, `priority:4` - Urgent
- `agent_id:123` - Assigned to agent
- `group_id:456` - In group
- `tag:'billing'` - Has tag
- `created_at:>'2024-01-01'` - Created after date

### Contact Search
- `email:john@example.com`
- `name:John`
- `phone:123456`

### Company Search
- `name:Acme`
- `domain:acme.com`

### Combine with AND/OR
- `(status:2 OR status:3) AND priority:4`

## Usage Examples

```
# List open tickets
list_tickets with filter "new_and_my_open"

# Search urgent tickets
search_tickets with query "priority:4"

# Create a ticket
create_ticket with subject "Login issue", description "Cannot log in", email "customer@example.com"

# Reply to customer
reply_to_ticket with ticket_id 12345, body "We're looking into this"

# Add internal note
add_note_to_ticket with ticket_id 12345, body "Escalated to engineering", private true

# Log time
create_time_entry with ticket_id 12345, time_spent "01:30", note "Investigated issue"

# Search knowledge base
search_solutions with query "password reset"
```

## Development

```bash
git clone https://github.com/NeuraLegion/freshdesk_mcp.git
cd freshdesk_mcp
npm install
npm run build
npm start
```

## License

MIT. Copyright (c) 2026 Bright Security. See [LICENSE](LICENSE) for details.
