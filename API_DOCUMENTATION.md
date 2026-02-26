# Sana Chatbot API Specification

## Base Information

- Service: Sana AI Health Chatbot
- Provider: EMRChains (<https://emrchains.com>)
- Upstream API: `https://sana.emrchains.com/api3/chat`
- Protocol: HTTP/REST
- Method: POST
- Content Type: JSON

## Request Format

json
{
  "unique_id": "string",           // [REQUIRED] Hospital/Organization ID
  "query": "string",               // [REQUIRED] User's message/question
  "history": ["string"],           // [OPTIONAL] Array of conversation history
  "chat_history": "string",        // [OPTIONAL] Formatted chat history (newline-separated)
  "end_user_id": "string",         // [OPTIONAL] Patient/End-user identifier
  "channel": "website"             // [REQUIRED] Fixed value: "website"
}

### Example Request

json
{
  "unique_id": "MIH-ISB-2009",
  "query": "I need information about appointments",
  "history": [
    "User: Hello",
    "Assistant: Hi, how can I help?"
  ],
  "chat_history": "User: Hello\nAssistant: Hi, how can I help?",
  "end_user_id": "patient_456",
  "channel": "website"
}

## Request Headers

Content-Type: application/json
Accept: text/plain; charset=utf-8

## Response Format

The API returns responses that can be either **JSON** or **plain text**:

json
{
  "data": "Response content here (text/json)"
}

### Response Features

- Plain text response
- Hospital name placeholder: `{hospital_name}` (replaced dynamically)
- Markdown formatting support (bold with `**text**`)
- Numbered lists and bullet points

---

## Configuration Requirements

Before calling the API, configure these values in localStorage:

| Key | Type | Required | Description |

| `sana_unique_id` | string | Yes | Hospital/Organization identifier |
| `sana_end_user_id` | string | No | Patient or end-user ID |
| `sana_hospital_name` | string | No | Hospital name (UI display) |
| `sana_logo` | string | No | Logo URL (default: `/sana.png`) |
| `sana_button_image` | string | No | Button image URL (default: `/emr.jpg`) |

---

## Error Handling

| Status | Scenario | Message |

| 200 | Success | Response data returned |
| 4xx/5xx | Server error | `Server error (status): details` |
| Network error | Connection failed | `Connection failed: error message` |
| No unique_id | Missing config | `Error: Hospital configuration (Unique ID) is missing. Please contact your administrator.` |

---

## Data Flow

1. **User sends message** → Stored in chat history
2. **Build payload** with message, history, and hospital config
3. **POST to `/api/sana-chat`** (local proxy)
4. **Proxy forwards** to `https://sana.emrchains.com/api3/chat`
5. **Response processed** with markdown formatting
6. **Display in UI** with hospital name substitution

---

## Chat History Format

History is sent in two formats:

### Array Format

javascript
["User: message 1", "Assistant: response 1", "User: message 2"]

### String Format

User: message 1
Assistant: response 1
User: message 2

## Pre-configured Query Types

The chatbot supports three predefined queries:

| Type | Content | Emoji |

| appointment | "Book an Appointment" | 🩺 |
| report | "I need information" | 📄 |
| assistant | "Talk to AI Health Assistant" | 💬 |

---

## Implementation Notes

- **CORS enabled** on client requests
- **Chat history persisted** in localStorage (`sana_chat_history`)
- **Configuration synced** via postMessage from parent window
- **Response formatting** includes markdown bold (`**text**`), newline handling, and list normalization
- **Fallback text**: "Thank you for your message." if API returns empty

---

## Integration Checklist

- [ ] Set `sana_unique_id` in localStorage
- [ ] Configure hospital name, logo, and button image
- [ ] Deploy proxy endpoint at `/api/sana-chat`
- [ ] Verify upstream connectivity to `https://sana.emrchains.com/api3/chat`
- [ ] Test message sending and response parsing
- [ ] Verify chat history persistence

---

## Example cURL Request

```bash
curl -X POST http://localhost:3000/api/sana-chat \
  -H "Content-Type: application/json" \
  -H "Accept: text/plain; charset=utf-8" \
  -d '{
    "unique_id": "hospital_123",
    "query": "I need information about appointments",
    "history": [
      "User: Hello",
      "Assistant: Hi, how can I help?"
    ],
    "chat_history": "User: Hello\nAssistant: Hi, how can I help?",
    "end_user_id": "patient_456",
    "channel": "website"
  }'
```

---

## Example JavaScript/TypeScript Request

```typescript
const payload = {
  unique_id: "hospital_123",
  query: "I need information about appointments",
  history: [
    "User: Hello",
    "Assistant: Hi, how can I help?"
  ],
  chat_history: "User: Hello\nAssistant: Hi, how can I help?",
  end_user_id: "patient_456",
  channel: "website"
};

const response = await fetch("/api/sana-chat", {
  method: "POST",
  mode: "cors",
  headers: {
    "Content-Type": "application/json",
    "Accept": "text/plain; charset=utf-8"
  },
  body: JSON.stringify(payload)
});

