# SSGzone Communication Platform
# PRODUCT REQUIREMENTS DOCUMENT (PRD)
# D1 — PART 4 OF 6
## Video Meetings & Shared Drive PRD

---

# MODULE 6 — VIDEO MEETINGS

---

## 6.1 Objective

Provide a fully self-hosted video conferencing system. No dependency on any third-party public service (Jitsi public, Zoom, Google Meet). Every video meeting must be hosted on the SSGzone infrastructure, ensuring privacy, data sovereignty, and white-label capability.

---

## 6.2 User Stories

### End User Stories

| ID | As a... | I want to... | So that... |
|----|---------|-------------|------------|
| VID-U01 | End User | Create a video meeting room | I can start a meeting |
| VID-U02 | End User | Join a meeting via a link | I can attend a meeting I was invited to |
| VID-U03 | End User | Share my screen during a meeting | I can present to participants |
| VID-U04 | End User | Mute and unmute my microphone | I can control my audio |
| VID-U05 | End User | Turn my camera on and off | I can control my video |
| VID-U06 | End User | See all participants in a grid view | I can see everyone in the meeting |
| VID-U07 | End User | Chat with participants during a meeting | I can share links or notes without interrupting |
| VID-U08 | End User | Raise my hand to signal I want to speak | I can get the host's attention |
| VID-U09 | End User | Schedule a meeting and add it to my calendar | I can plan meetings in advance |
| VID-U10 | End User | See a participant list during the meeting | I know who is in the meeting |
| VID-U11 | End User | Leave a meeting without ending it for others | I can exit without disrupting the meeting |

### Tenant Admin / Host Stories

| ID | As a... | I want to... | So that... |
|----|---------|-------------|------------|
| VID-H01 | Meeting Host | Mute all participants | I can control noise in large meetings |
| VID-H02 | Meeting Host | Remove a participant from the meeting | I can manage disruptive participants |
| VID-H03 | Meeting Host | Lock the meeting room | No new participants can join |
| VID-H04 | Meeting Host | End the meeting for all participants | I can close the meeting cleanly |
| VID-H05 | Tenant Admin | View meeting history and duration | I can monitor meeting usage |

---

## 6.3 Acceptance Criteria

| ID | Criteria | Test Method |
|----|----------|-------------|
| AC-VID-01 | User can create a meeting room and receive a join link | Create room, verify link is generated |
| AC-VID-02 | Two users can join the same room and see each other's video | Join from two browsers, verify video streams |
| AC-VID-03 | Audio and video quality is acceptable at 720p | Manual quality assessment |
| AC-VID-04 | Screen sharing works and is visible to all participants | Share screen, verify visibility from second browser |
| AC-VID-05 | Meeting works with 10 simultaneous participants | Load test with 10 browser instances |
| AC-VID-06 | No reference to `jit.si` or any third-party video service exists | Code audit and network traffic inspection |
| AC-VID-07 | Meeting join link does not expose internal server details | Inspect join URL format |
| AC-VID-08 | Host can mute all participants with one click | Mute all, verify all participants are muted |
| AC-VID-09 | Host can remove a participant | Remove participant, verify they are disconnected |
| AC-VID-10 | Meeting is accessible only to users within the same tenant | Attempt to join from different tenant, verify rejection |
| AC-VID-11 | In-meeting chat messages are delivered within 500ms | Send chat message, measure delivery time |

---

## 6.4 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Meeting join success rate | > 99% | Meeting server logs |
| Average meeting setup time | < 3 seconds from click to video | End-to-end timing |
| Maximum concurrent participants per room | 50 (Phase 2), 200 (Phase 4) | Load test |
| Video quality at 720p | No visible artifacts under normal network | Manual assessment |
| Meeting uptime | > 99.9% | Monitoring |

---

## 6.5 Business Rules

| ID | Rule |
|----|------|
| BR-VID-01 | All video traffic must be routed through SSGzone's own infrastructure — no third-party video servers |
| BR-VID-02 | A meeting room belongs to a tenant — cross-tenant access is not permitted |
| BR-VID-03 | Meeting join links expire after 24 hours if the meeting has not started |
| BR-VID-04 | A meeting room can have a maximum of 50 participants in Phase 2 (expandable) |
| BR-VID-05 | Only the meeting creator or a Tenant Admin can end the meeting for all |
| BR-VID-06 | Meeting recordings (Phase 3) are stored in MinIO with tenant isolation |
| BR-VID-07 | Guest access (joining without a platform account) is configurable per meeting |
| BR-VID-08 | Meeting history (date, duration, participant count) is retained for 90 days |

---

## 6.6 Edge Cases

| ID | Scenario | Expected Behavior |
|----|----------|-------------------|
| EC-VID-01 | Host leaves the meeting | Meeting continues — host role is transferred to the next participant |
| EC-VID-02 | All participants leave except one | Meeting continues until the last participant leaves or the room expires |
| EC-VID-03 | Participant's internet drops during a meeting | Participant is shown as disconnected — can rejoin via the same link |
| EC-VID-04 | User tries to join a meeting that has been locked | User sees a "Meeting is locked" message and cannot join |
| EC-VID-05 | User joins from a browser that does not support WebRTC | User sees a clear error message with browser requirements |
| EC-VID-06 | Video server goes down during an active meeting | All participants are disconnected — meeting server logs the incident |
| EC-VID-07 | User shares screen and then opens a new window | Screen share continues to show the originally shared content |
| EC-VID-08 | 51st participant tries to join a 50-person meeting | User sees a "Meeting is full" message |

---

---

# MODULE 7 — SHARED DRIVE

---

## 7.1 Objective

Provide every user with a personal and shared file storage system — comparable to Google Drive or OneDrive. Users must be able to upload, organize, share, and collaborate on files. All files are stored on SSGzone's own infrastructure (MinIO) with tenant isolation, encryption, and storage quotas.

---

## 7.2 User Stories

### End User Stories

| ID | As a... | I want to... | So that... |
|----|---------|-------------|------------|
| DRV-U01 | End User | Upload files to my drive | I can store documents in the cloud |
| DRV-U02 | End User | Create folders to organize my files | I can keep my drive organized |
| DRV-U03 | End User | Download a file | I can access my files on any device |
| DRV-U04 | End User | Share a file with a specific colleague | I can collaborate on documents |
| DRV-U05 | End User | Share a folder with a team | My team can access shared resources |
| DRV-U06 | End User | Set permissions on shared files (View, Edit) | I can control what others can do |
| DRV-U07 | End User | See previous versions of a file | I can recover from accidental changes |
| DRV-U08 | End User | Restore a previous version of a file | I can undo unwanted changes |
| DRV-U09 | End User | Preview a file without downloading it | I can quickly check file contents |
| DRV-U10 | End User | Move and rename files and folders | I can reorganize my drive |
| DRV-U11 | End User | Delete files and folders | I can free up storage space |
| DRV-U12 | End User | See my storage usage | I know how much space I have left |
| DRV-U13 | End User | Share a file from Drive directly into a chat | I can share files without downloading and re-uploading |
| DRV-U14 | End User | Attach a file from Drive to an email | I can send Drive files via email |
| DRV-U15 | End User | Search for files by name | I can find any file quickly |

### Tenant Admin Stories

| ID | As a... | I want to... | So that... |
|----|---------|-------------|------------|
| DRV-T01 | Tenant Admin | Set storage quotas per user | I can manage storage costs |
| DRV-T02 | Tenant Admin | View total storage usage per user | I can monitor usage |
| DRV-T03 | Tenant Admin | Create shared team folders | Teams have a common file repository |
| DRV-T04 | Tenant Admin | Recover a deleted file within 30 days | I can restore accidentally deleted files |

---

## 7.3 Acceptance Criteria

| ID | Criteria | Test Method |
|----|----------|-------------|
| AC-DRV-01 | User can upload a file up to 500MB | Upload 500MB file, verify completion |
| AC-DRV-02 | Uploaded file is accessible after page refresh | Upload file, refresh, verify file listed |
| AC-DRV-03 | User can create nested folders (3 levels deep minimum) | Create folder > subfolder > sub-subfolder |
| AC-DRV-04 | Shared file is accessible to the recipient | Share file, log in as recipient, verify access |
| AC-DRV-05 | Recipient with View permission cannot delete the file | Share with View, attempt delete as recipient, verify rejection |
| AC-DRV-06 | File version history shows at least 5 previous versions | Edit file 6 times, verify 5 previous versions listed |
| AC-DRV-07 | User can restore a previous version | Restore version 3, verify file content matches version 3 |
| AC-DRV-08 | PDF files show a preview in the browser | Upload PDF, click preview, verify in-browser preview |
| AC-DRV-09 | Image files show a preview in the browser | Upload JPG, click preview, verify in-browser preview |
| AC-DRV-10 | Storage quota is enforced — upload fails when quota is exceeded | Fill quota, attempt upload, verify rejection with clear message |
| AC-DRV-11 | Deleted files go to Trash and can be restored within 30 days | Delete file, restore from Trash, verify restoration |
| AC-DRV-12 | File shared from Drive appears in chat as a clickable link | Share to chat, verify link in chat |
| AC-DRV-13 | File search returns results within 2 seconds | Search for known filename |
| AC-DRV-14 | Files from Tenant A are not accessible to Tenant B | Attempt cross-tenant file access, verify rejection |

---

## 7.4 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| File upload success rate | > 99.9% | Upload logs |
| File download success rate | > 99.9% | Download logs |
| File preview load time | < 2 seconds | Frontend monitoring |
| Search response time | < 2 seconds | Performance test |
| Storage quota enforcement accuracy | 100% | Quota test suite |
| User adoption | > 50% of users upload at least 1 file per week | Usage analytics |

---

## 7.5 Business Rules

| ID | Rule |
|----|------|
| BR-DRV-01 | All files are stored in MinIO with AES256 server-side encryption |
| BR-DRV-02 | Files are stored with tenant-prefixed keys — cross-tenant access is impossible at storage level |
| BR-DRV-03 | Maximum file upload size is 500MB per file (configurable per plan) |
| BR-DRV-04 | Storage quota is enforced at upload time — upload is rejected if it would exceed quota |
| BR-DRV-05 | Deleted files are retained in Trash for 30 days before permanent deletion |
| BR-DRV-06 | Files in Trash count against storage quota |
| BR-DRV-07 | File versioning retains a maximum of 10 previous versions per file |
| BR-DRV-08 | Sharing a file generates a unique access token — the file URL alone is not sufficient |
| BR-DRV-09 | A user can share a file with a maximum of 50 individual users or 10 groups |
| BR-DRV-10 | Tenant Admin can access all files within their tenant for compliance purposes |
| BR-DRV-11 | File names must be unique within the same folder |
| BR-DRV-12 | Maximum folder nesting depth is 10 levels |

---

## 7.6 Edge Cases

| ID | Scenario | Expected Behavior |
|----|----------|-------------------|
| EC-DRV-01 | User uploads a file with the same name as an existing file | System prompts: Replace, Keep Both, or Cancel |
| EC-DRV-02 | User deletes a folder that contains shared files | Shared links to files inside the folder become invalid — recipients are notified |
| EC-DRV-03 | User's storage quota is 100MB and they try to upload a 150MB file | Upload is rejected before it starts with a clear message |
| EC-DRV-04 | User tries to preview a file type that is not supported | System shows a "Preview not available" message with a download button |
| EC-DRV-05 | User restores a file version that is older than the current shared version | Restored version becomes the current version — share links still work |
| EC-DRV-06 | MinIO goes down temporarily | Upload/download fails with a clear error — no data corruption |
| EC-DRV-07 | User uploads a file that ClamAV flags as malware | File is quarantined, user is notified, file is not accessible |
| EC-DRV-08 | User moves a shared folder to a private location | Shared links to files inside the folder become invalid |
| EC-DRV-09 | Two users edit the same file simultaneously | System does not support real-time co-editing in Phase 2 — last upload wins, version history preserved |
| EC-DRV-10 | Tenant is deleted | All tenant files are queued for GDPR-compliant deletion from MinIO |
| EC-DRV-11 | User tries to create a folder with a name containing special characters | Special characters are sanitized or rejected with a clear message |
| EC-DRV-12 | File upload is interrupted midway | Partial upload is discarded — no incomplete files stored |

---

*End of D1 Part 4 of 6*
*Next: PRD_PART_05.md — Notifications + Search + Directory*
