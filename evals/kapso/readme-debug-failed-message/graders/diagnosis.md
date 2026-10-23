---
type: llm
---

PASS if the response says the message failed because more than 24 hours had passed since the customer's last reply (the customer service window was closed), says an approved template message is needed to reach the customer, and says the webhook delivery was retried and succeeded on the third attempt after the first two attempts failed.
FAIL if it gives a different cause, or says the webhook was not retried.
