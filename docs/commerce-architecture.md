# ACEIIIT Commerce Architecture

## 1. System Architecture
ACEIIIT uses a Node.js (Express) backend linked to a Prisma-managed Database, which interacts with the legacy Mock Portal backend via secure internal API calls.
**RAZORPAY IS NOT CURRENTLY USED.** Payment is strictly manual UPI verification via admin approval.

## 2. Database Responsibilities
- **Commerce DB**: Source of truth for Users, Products, Orders, Payments, Receipts, Entitlements, and Course Enrollments.
- **Mock Portal DB**: Exclusively source of truth for Mock Tests, Attempts, and test-specific data. It does not store commerce data.

## 3. Order Lifecycle
1. User adds items locally and checks out.
2. Frontend calls `POST /api/orders` with product IDs.
3. Backend fetches prices, calculates totals safely (ignoring client prices).
4. Order created in `PENDING` state. Order Items created as immutable snapshots.

## 4. Payment Lifecycle
1. User pays via UPI to ACEIIIT's UPI ID.
2. User uploads receipt and provides 12-digit UTR.
3. Backend creates Payment in `PENDING_VERIFICATION` state.
4. Admin reviews and approves, changing status to `VERIFIED`.

## 5. Receipt Lifecycle
1. Uploaded via `POST /api/receipts/upload` (Max 5MB, strict MIME checks).
2. Saved anonymously with UUID (e.g. `receipts/uuid.jpeg`) in a private non-public directory.
3. Admins generate 120-second short-lived Signed URLs to view them safely.

## 6. Entitlement Lifecycle
1. Admin verifies payment.
2. System generates `Entitlement` records for purchased items.
3. Default status is `ACTIVE`.
4. Provisioning status starts as `PENDING_PROVISIONING`.

## 7. Enrollment Lifecycle
Generated concurrently with Entitlements for specific Courses, managed inside Commerce DB.

## 8. Mock Portal Integration
When an Entitlement requires Mock Portal Access, `CommerceService` makes a server-to-server authenticated call (`POST /internal/access/provision` equivalent) to the Mock Portal backend. The browser is never involved.

## 9. Identity Linking
`StudentIdentity` model links the Commerce User ID to the Mock User ID to ensure consistent provisioning.

## 10. Provisioning States
- `PENDING_PROVISIONING`
- `PROVISIONED`
- `PROVISIONING_FAILED`

## 11. Retry Behavior
If Mock Portal is down:
- Payment is still `VERIFIED`.
- Entitlement is `ACTIVE`.
- Provisioning falls to `PROVISIONING_FAILED`.
- Idempotent manual retries can be triggered later.

## 12. Admin Workflow
- Log into Admin Panel.
- View Pending Payments.
- Inspect UTR and Receipt via Signed URL.
- Approve or Reject (requires reason).
- Audit log is automatically recorded.

## 13. Security Model
- No client-side price trust.
- Receipts are strictly private.
- S2S integration for Mock Portal.
- All actions logged in `AuditLog`.

## 14. Environment Variables
- `DATABASE_URL`: Prisma connection string
- `JWT_SECRET`: Secret for signing tokens and URLs
- `PORT`: Server port

## 15. Local Development Setup
1. `npm install`
2. `npx prisma db push`
3. `npm run dev`

## 16. Production Deployment Considerations
- Swap SQLite for PostgreSQL in Prisma.
- Migrate local receipt storage to a private AWS S3 bucket.
- Configure S2S internal firewall.

## 17. Disaster/Failure Scenarios
- Mock Portal Down: Payment verification succeeds, provisioning queues.
- DB Failure: Relational ACID constraints prevent half-created orders.

## 18. How to add a new product
Add a record to the `Product` table with appropriate pricing and tax configurations.

## 19. How to add a new entitlement type
Update the product's `metadata` JSON to specify new `resourceCode` requirements and handle them in `CommerceService.provisionEntitlements()`.

## 20. How to add another downstream access system later
Replicate the Mock Portal pattern: intercept the entitlement creation, determine the remote target via `resourceCode`, map identities, and fire an idempotent S2S hook.
