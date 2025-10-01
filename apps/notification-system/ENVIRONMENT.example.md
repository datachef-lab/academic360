Notification System Environment Variables

Core

- PORT=8080
- NODE_ENV=development
- DATABASE_URL=postgres://user:pass@localhost:5432/academic360

Email (ZeptoMail)

- ZEPTO_URL=https://api.zeptomail.in/v1.1
- ZEPTO_FROM=no-reply@example.com
- ZEPTO_TOKEN=**YOUR_ZEPTO_TOKEN**
- DEVELOPER_EMAIL=dev@example.com

WhatsApp (Interakt)

- INTERAKT_API_KEY=**YOUR_INTERAKT_API_KEY**
- INTERAKT_BASE_URL=https://api.interakt.ai/v1/public/message/
- DEVELOPER_PHONE=9999999999

Workers Tuning

- EMAIL_POLL_MS=3000
- EMAIL_BATCH_SIZE=50
- EMAIL_RATE_DELAY_MS=250
- EMAIL_MAX_RETRIES=5
- WHATSAPP_POLL_MS=3000
- WHATSAPP_BATCH_SIZE=50
- WHATSAPP_RATE_DELAY_MS=300
- WHATSAPP_MAX_RETRIES=5
