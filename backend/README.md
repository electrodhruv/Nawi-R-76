# NAWI-R76 Type Evaluation Laboratory Backend

Automated Type Evaluation & Test Report Generation System per OIML R 76-1:2006 (E), OIML R 76-2:2007 (E), and ISO/IEC 17025:2017.

## Architecture Overview
This backend service provides:
1. **Server-Authoritative Metrology Engine**: Formula calculations (P = I + 0.5e - dL, Ec = E - E0), dynamic Table 6 MPE limits, and integrity locks.
2. **Role-Based Access Control (RBAC)**: ISO/IEC 17025 §6.2 compliant workflows for Testing Officers, Technical Reviewers, and Lead Metrologists.
3. **Reference Standards Management**: Traceability, calibration validity, and uncertainty (U <= 1/3 MPE) per Clause 3.7.1.
4. **Evidence & SHA-256 Hashing**: Tamper-proof physical evidence registry with OCR extraction.
5. **Cryptographic Audit Trail**: Immutable SHA-256 chained transaction logs for all entity mutations.
6. **Report Generation & PKI Signatures**: OIML R 76-2 test reports, digital signatures, and public QR code verification.
7. **OIML AI Metrology Copilot**: RAG-assisted regulatory advisory assistant.
