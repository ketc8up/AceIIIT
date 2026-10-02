# ACEIIIT Commerce Architecture Audit

## 1. Existing Architecture
The current ACEIIIT repository consists entirely of a static site built using HTML, CSS, and Vanilla JavaScript.
* **Frontend:** Plain HTML/CSS/JS with no frontend framework (e.g., React, Vue) being used in the main site.
* **Backend:** NOT DETERMINED FROM CURRENT CODEBASE. There are no backend configuration files, framework routes, or server-side scripts in this repository.
* **Build System:** Python scripts (`generate_pages.py`, `replace_js.py`, etc.) are used for static site generation and asset management.

## 2. Existing Database Structure
NOT DETERMINED FROM CURRENT CODEBASE.
There are no database configurations, connection strings, migrations, or models defined in this repository.

## 3. Existing Checkout Flow
The checkout flow is implemented purely client-side in `checkout.html` and `js/checkout.js`:
* **Products:** "Class + Notes" (₹1499), "Paid Mock Series" (₹599), "Interview Guidance" (₹699).
* **Prices:** Hardcoded in `js/checkout.js` (`COUPONS` and `COURSES` arrays).
* **Tax Handling:** A flat 18% GST is calculated client-side in JS based on the subtotal.
* **Coupon Handling:** Hardcoded client-side coupons (`UGEE10`, `FIRST200`, `EARLYBIRD`).
* **Form Fields:** First Name, Last Name, Email, Phone, College / Institution, Exam Attempt Year.
* **Submit Behavior:** The payment processing is currently a simulated `setTimeout` function of 2000ms. It generates a fake order reference (`ACE-...`) client-side.
* **Payment Proof:** There is currently no file upload mechanism for payment proof or UTR in the codebase. The UI has tabs for Card, UPI, and Netbanking but they are purely visual.

## 4. Existing Admin Flow
NOT DETERMINED FROM CURRENT CODEBASE.
There are no admin dashboards, login pages, or administrative routes present in the codebase.

## 5. Existing Mock Portal Architecture
NOT DETERMINED FROM CURRENT CODEBASE.
Visual references and frontend mockups exist (e.g., `saas/aceiiit-box-project`), but there is no actual backend, database, test/access model, or user model for the Mock Portal in this repository.

## 6. Existing Identity Relationship
NOT DETERMINED FROM CURRENT CODEBASE.
It is unknown whether the Mock Portal and ACEIIIT commerce system share identity identifiers, as neither authentication mechanism exists in the current codebase.

## 7. Existing Payment-Related Implementation
* Manual UPI verification is requested for the future, but currently, the UI just shows visual dummy input fields.
* There is a commented-out stub for Razorpay integration in `js/checkout.js`.
* State management for the cart relies entirely on `sessionStorage` (`aceiiit_selected_courses`).

## 8. Security Risks
* **Frontend-submitted Prices:** The entire pricing and discount logic is executed on the client side. A user can easily manipulate the DOM or JavaScript variables to change the final `grand` total to ₹0.
* **Frontend-submitted Product IDs:** Product selection is completely trusted via `sessionStorage` without server validation.
* **Coupon Abuse:** Coupons are verified locally, meaning a user can inject their own coupons or bypass validation.
* **Authentication/Authorization Weaknesses:** No authentication exists; thus, anyone can access any page.
* **Missing Validation:** Form validation is purely client-side HTML5 validation (`required`, regex). No server-side sanitization.
* **Duplicate Payment/Enrollment Risks:** Because there is no backend state, a user could refresh or resubmit the confirmation sequence multiple times without tracking.
* **Public Storage URLs / Secrets:** No exposed secrets were found, but primarily because there is no backend integrated yet.

## 9. Recommended Integration Architecture
To implement the Manual UPI Verification without Razorpay and without disrupting the existing Mock Portal:
* **Backend Framework:** Introduce a lightweight Node.js/Express or Python/FastAPI backend within a new `/api` or `/backend` directory.
* **Database:** PostgreSQL or MongoDB to store Orders, Users, and Entitlements.
* **Storage Integrations:** Use AWS S3 or a similar object storage service for securely uploading and serving payment screenshots.
* **Admin Approval Flow:** Create an authenticated `/admin` route or separate lightweight admin dashboard that reads `PENDING_VERIFICATION` orders and toggles them to `APPROVED`.
* **Mock Portal Integration:** Upon approval, the backend will issue an internal API call or database write to provision the user's entitlements into the separate Mock Portal system.

## 10. Files That Will Need Modification
* `checkout.html` (to add UTR input and file upload for payment proof, and update the form submission to POST to a real backend).
* `js/checkout.js` (to handle actual API calls instead of `setTimeout` simulation, remove local price calculation, and handle FormData for uploads).
* `.gitignore` (to exclude newly added backend dependencies or environment files).

## 11. Files That Should NOT Be Modified
* `saas/*` (The frontend 3D box project logic).
* Python generation scripts (`generate_pages.py`, etc.) unless adding a new page.
* Existing marketing pages (`index.html`, `about.html`, etc.) unless changing navigation links.

## 12. Dependencies That May Be Required
* Backend runtime (e.g., `Node.js` + `express` or `Python` + `fastapi`).
* Database ORM/driver (e.g., `prisma`, `pg`, `mongoose`).
* File upload middleware (e.g., `multer`).
* Storage SDK (e.g., `@aws-sdk/client-s3`).

## 13. Environment Variables That May Be Required
* `DATABASE_URL`
* `ADMIN_SECRET` or `JWT_SECRET`
* `STORAGE_BUCKET_NAME`
* `STORAGE_ACCESS_KEY`
* `STORAGE_SECRET_KEY`
* `MOCK_PORTAL_API_KEY` (if provisioning via API)

## 14. Open Questions
* Where is the Mock Portal database hosted, and do we have direct database access or an internal API to provision entitlements?
* How are students currently authenticated in the Mock Portal (e.g., OAuth, Email/Password)?
* What is the desired schema for the manual payment proof (image formats allowed, max file size)?
* Should the admin dashboard be integrated into this frontend repo or built as a separate internal tool?

---

## Implementation Plan

### PHASE 1
**Backend & Database Initialization**
* Scaffold the backend structure in a new directory.
* Set up the database schema for Users, Orders (with states: PENDING_VERIFICATION, APPROVED, REJECTED), and Entitlements.
* Create environment variable configurations.

### PHASE 2
**Storage & File Upload Setup**
* Set up cloud storage (S3/R2) for hosting payment screenshots.
* Create an API endpoint for securely uploading UTR numbers and payment proof images.

### PHASE 3
**Checkout Frontend Integration**
* Modify `checkout.html` to replace the generic UPI tab with a mandatory UTR input and file upload field.
* Update `js/checkout.js` to POST the cart data, user details, and payment proof to the new backend endpoint.
* Implement error handling and loading states for the upload process.

### PHASE 4
**Order Creation & Validation Backend**
* Implement the checkout endpoint to securely calculate prices on the server.
* Validate uploaded data and insert a new Order record with status `PENDING_VERIFICATION`.

### PHASE 5
**Admin Dashboard & Review Flow**
* Create a secure admin route/page to list all `PENDING_VERIFICATION` orders.
* Build the UI for admins to view the payment screenshot, UTR, and user details.
* Implement the API endpoints to Approve or Reject orders.

### PHASE 6
**Mock Portal Provisioning Integration**
* Implement the logic triggered upon Order Approval.
* Create the database record or dispatch the API request to the external Mock Portal system to grant the required course/test access.
* Configure automated email notifications (if required) to inform the student of their successful enrollment.
