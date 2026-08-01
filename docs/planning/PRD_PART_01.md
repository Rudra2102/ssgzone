# SSGzone Communication Platform
# PRODUCT REQUIREMENTS DOCUMENT (PRD)
# D1 — PART 1 OF 6
## Introduction & Enterprise Mail PRD

---

**Document Version**: 1.0
**Classification**: Internal — Product & Engineering
**Purpose**: This document is the official reference for the implementation team. It defines what to build, why to build it, and how to verify it is built correctly.

---

## PRD DOCUMENT INDEX

| Part | File | Modules Covered |
|------|------|-----------------|
| D1-Part-1 | PRD_PART_01.md | Introduction + Enterprise Mail |
| D1-Part-2 | PRD_PART_02.md | Calendar + Contacts |
| D1-Part-3 | PRD_PART_03.md | Internal Chat + Presence |
| D1-Part-4 | PRD_PART_04.md | Video Meetings + Shared Drive |
| D1-Part-5 | PRD_PART_05.md | Notifications + Search + Directory |
| D1-Part-6 | PRD_PART_06.md | Authentication + Multi-Tenancy + SaaS Integration |

---

## How to Read This Document

Each module follows this structure:

- **Objective** — Why this module exists
- **User Stories** — What users need to do
- **Acceptance Criteria** — How we verify it is done correctly
- **Success Metrics** — How we measure success after launch
- **Business Rules** — Non-negotiable constraints
- **Edge Cases** — Unusual scenarios the system must handle

---

---

# MODULE 1 — ENTERPRISE MAIL

---

## 1.1 Objective

Provide every user with a fully functional, professional email account under their organization's subdomain (`username@tenant.saas.ssgzone.in`). The mail system must support sending, receiving, organizing, searching, and managing email — comparable to Gmail or Zoho Mail — while being completely self-hosted.

---

## 1.2 User Stories

### End User Stories

| ID | As a... | I want to... | So that... |
|----|---------|-------------|------------|
| MAIL-U01 | End User | Compose and send an email to any address | I can communicate with colleagues and external contacts |
| MAIL-U02 | End User | Receive emails in my inbox | I can read messages sent to me |
| MAIL-U03 | End User | Reply and forward emails | I can respond to and share messages |
| MAIL-U04 | End User | Organize emails into folders | I can keep my inbox clean |
| MAIL-U05 | End User | Search my emails by sender, subject, or content | I can find any email quickly |
| MAIL-U06 | End User | Add attachments to emails | I can share files via email |
| MAIL-U07 | End User | Create email signatures | My emails look professional |
| MAIL-U08 | End User | Set up an autoresponder | People know I am unavailable |
| MAIL-U09 | End User | Create email rules | Emails are automatically sorted |
| MAIL-U10 | End User | Add email aliases | I can receive mail on multiple addresses |
| MAIL-U11 | End User | Schedule an email to send later | I can write now and send at the right time |
| MAIL-U12 | End User | Mark emails as read, unread, starred, or spam | I can manage my inbox state |
| MAIL-U13 | End User | Permanently delete or archive emails | I can manage my storage |
| MAIL-U14 | End User | Import emails from another provider | I can migrate my existing mail |

### Tenant Admin Stories

| ID | As a... | I want to... | So that... |
|----|---------|-------------|------------|
| MAIL-T01 | Tenant Admin | Create email accounts for my users | My team has professional email addresses |
| MAIL-T02 | Tenant Admin | Set storage quotas per user | I can manage storage costs |
| MAIL-T03 | Tenant Admin | View mail usage per user | I can monitor usage |
| MAIL-T04 | Tenant Admin | Configure mail retention policy | Emails are deleted after a defined period |
| MAIL-T05 | Tenant Admin | Create shared mailboxes | Teams can share a common inbox |
| MAIL-T06 | Tenant Admin | Configure spam filtering sensitivity | I can control what is flagged as spam |

### SaaS Admin Stories

| ID | As a... | I want to... | So that... |
|----|---------|-------------|------------|
| MAIL-S01 | SaaS Admin | View total mail volume across all tenants | I can monitor platform usage |
| MAIL-S02 | SaaS Admin | Configure DKIM and DMARC for my domain | My tenants' emails are delivered reliably |
| MAIL-S03 | SaaS Admin | Set default mail quotas for new tenants | I can control costs |

---

## 1.3 Acceptance Criteria

### Sending & Receiving

| ID | Criteria | Test Method |
|----|----------|-------------|
| AC-MAIL-01 | User can compose and send an email to an external address | Send to a Gmail address and verify receipt |
| AC-MAIL-02 | User can receive an email sent from an external address | Send from Gmail to platform address and verify receipt |
| AC-MAIL-03 | Sent email appears in Sent folder | Send email and check Sent folder |
| AC-MAIL-04 | Email delivery time is under 30 seconds for internal mail | Send between two platform users and measure time |
| AC-MAIL-05 | Attachments up to 25MB can be sent and received | Attach a 25MB file and verify receipt |
| AC-MAIL-06 | Emails are delivered with correct DKIM signature | Check email headers for valid DKIM |
| AC-MAIL-07 | Emails pass DMARC check | Use mail-tester.com to verify DMARC pass |
| AC-MAIL-08 | All SMTP connections use TLS | Verify with Wireshark or mail server logs |

### Organization & Management

| ID | Criteria | Test Method |
|----|----------|-------------|
| AC-MAIL-09 | User can create, rename, and delete custom folders | Create folder "Projects", rename to "Work", delete |
| AC-MAIL-10 | User can move emails between folders | Move email from Inbox to custom folder |
| AC-MAIL-11 | User can mark email as read, unread, starred | Toggle each state and verify persistence |
| AC-MAIL-12 | User can permanently delete email | Delete email and verify it is gone from all folders |
| AC-MAIL-13 | Deleted emails go to Trash and are auto-purged after 30 days | Move to Trash, verify auto-purge after 30 days |
| AC-MAIL-14 | User can archive emails | Archive email and find it in Archive folder |

### Search

| ID | Criteria | Test Method |
|----|----------|-------------|
| AC-MAIL-15 | User can search by sender email address | Search for known sender and verify results |
| AC-MAIL-16 | User can search by subject | Search for known subject and verify results |
| AC-MAIL-17 | User can search by body content | Search for a word in email body and verify results |
| AC-MAIL-18 | Search returns results within 2 seconds for mailboxes up to 10,000 emails | Load test with 10,000 emails |

### Rules & Automation

| ID | Criteria | Test Method |
|----|----------|-------------|
| AC-MAIL-19 | User can create a rule: if sender is X, move to folder Y | Create rule and send test email from X |
| AC-MAIL-20 | User can create a rule: if subject contains X, mark as read | Create rule and send test email with subject |
| AC-MAIL-21 | Autoresponder sends reply when enabled | Enable autoresponder and send test email |
| AC-MAIL-22 | Autoresponder does not reply to the same sender more than once per day | Send 3 emails from same address, verify only 1 autoresponse |

### Aliases & Signatures

| ID | Criteria | Test Method |
|----|----------|-------------|
| AC-MAIL-23 | User can add an alias and receive mail on it | Add alias, send to alias, verify receipt in main inbox |
| AC-MAIL-24 | User can create and select a signature when composing | Create signature, compose email, verify signature appears |
| AC-MAIL-25 | Signature supports basic HTML formatting | Create HTML signature with bold and link |

---

## 1.4 Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|--------------------|
| Mail delivery success rate | > 99% | Mail server delivery logs |
| Average inbox load time | < 1.5 seconds | Frontend performance monitoring |
| Spam detection rate | > 95% of spam caught | Manual spam test set |
| False positive rate | < 0.1% | Monitor user "not spam" reports |
| DKIM pass rate | 100% | Mail header analysis |
| DMARC pass rate | 100% | DMARC reporting |
| Search response time | < 2 seconds | Load test |
| User adoption | > 80% of provisioned users active within 30 days | Usage analytics |

---

## 1.5 Business Rules

| ID | Rule |
|----|------|
| BR-MAIL-01 | Every user must have exactly one primary email address in the format `username@tenant.saas.ssgzone.in` |
| BR-MAIL-02 | A user can have a maximum of 5 aliases (configurable per plan) |
| BR-MAIL-03 | Maximum attachment size is 25MB per email |
| BR-MAIL-04 | Storage quota is enforced — user cannot send or receive when quota is exceeded |
| BR-MAIL-05 | Deleted emails are retained in Trash for 30 days before permanent deletion |
| BR-MAIL-06 | Emails in Trash count against storage quota |
| BR-MAIL-07 | DKIM signing is mandatory for all outgoing mail |
| BR-MAIL-08 | DMARC policy must be set to at least `p=quarantine` for all tenant domains |
| BR-MAIL-09 | A user can create a maximum of 20 mail rules |
| BR-MAIL-10 | Autoresponder must include an unsubscribe mechanism for external recipients |
| BR-MAIL-11 | Mail retention policy, when set, overrides user's manual deletion — emails are purged regardless |
| BR-MAIL-12 | Shared mailboxes do not count as user seats for billing purposes |

---

## 1.6 Edge Cases

| ID | Scenario | Expected Behavior |
|----|----------|-------------------|
| EC-MAIL-01 | User sends email to their own address | Email is delivered to their own inbox normally |
| EC-MAIL-02 | User's storage quota is exactly full when receiving a new email | Email is rejected with a bounce message to sender |
| EC-MAIL-03 | User creates a mail rule that creates a loop (forward to self) | System detects loop after 3 hops and stops delivery |
| EC-MAIL-04 | Attachment contains a virus detected by ClamAV | Email is quarantined, user is notified, attachment is not delivered |
| EC-MAIL-05 | User tries to send to an invalid email address | Immediate bounce with clear error message |
| EC-MAIL-06 | Incoming email has no subject | Email is delivered with subject shown as "(No Subject)" |
| EC-MAIL-07 | User deletes a folder that contains emails | Emails are moved to Trash before folder is deleted |
| EC-MAIL-08 | Two users have the same name in different tenants | Each has a unique email address — no conflict |
| EC-MAIL-09 | User imports a very large MBOX file (>1GB) | Import runs as background job, user is notified on completion |
| EC-MAIL-10 | External mail server is temporarily unreachable | Mail is queued and retried for up to 72 hours with exponential backoff |
| EC-MAIL-11 | User's account is deactivated while they have unread mail | Mail continues to be received but user cannot log in |
| EC-MAIL-12 | Tenant is deleted | All tenant mail is queued for GDPR-compliant deletion |
| EC-MAIL-13 | User sends an email with 10 attachments | All attachments are sent if total size is under 25MB |
| EC-MAIL-14 | Autoresponder is enabled and user receives a mailing list email | Autoresponder does not reply to mailing lists (detected via List-Unsubscribe header) |

---

*End of D1 Part 1 of 6*
*Next: PRD_PART_02.md — Calendar + Contacts*
