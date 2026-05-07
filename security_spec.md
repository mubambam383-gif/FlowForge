# Security Spec - FlowForge

## Data Invariants
1. Users can only access their own profile data.
2. Projects must belong to an Organization.
3. Users can only access Projects within Organizations they are members of.
4. API Requests and Webhooks must belong to a valid Project.
5. Incoming Webhook Events are internal/system-generated and should not be directly modifiable by clients except through the designated endpoint (though here the client is the listener).
6. Timestamps (`createdAt`, `updatedAt`, `receivedAt`) must be server-generated.

## The Dirty Dozen Payloads (Unauthorized Attempts)

1. **Identity Spoofing**: User A tries to create a Project with `ownerId` of User B.
2. **Cross-Organization Access**: User A (Org 1) tries to list Projects in Org 2.
3. **Ghost Field Injection**: User tries to update a Project with an undocumented field `isAdmin: true`.
4. **Orphaned Write**: User tries to create an API Request for a Project ID that doesn't exist.
5. **Timestamp Manipulation**: User tries to set `createdAt` to a date in the future.
6. **Malicious ID**: User tries to create a Project with ID containing junk characters like `../../../etc/passwd`.
7. **Resource Exhaustion**: User tries to send a 2MB JSON string in the `body` field of an API Request.
8. **Terminal State Bypass**: User tries to change an API Response once it's already stored (immutable).
9. **PII Leak**: Unauthenticated user tries to read a User profile's `email`.
10. **Role Escalation**: User tries to update their own `role` in the company.
11. **Action Bypass**: User tries to update `lastExecuted` on a Request without going through the transition logic.
12. **Blanket Query**: User tries to list ALL users in the system without filters.
