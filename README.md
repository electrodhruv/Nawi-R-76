# NAWI-R76 Metrology Laboratory Evaluation & Verification Platform

> **Automated Legal Metrology Type Evaluation & Certificate Issuance System**  
> Built strictly according to **OIML R 76-1:2006 (E)**, **OIML R 76-2:2007 (E)**, and **ISO/IEC 17025:2017** standards.

---

## 🌟 Key Capabilities

- **Automated OIML R 76-1 Test Plan Matrix**: Dynamic rule engine resolving mandatory metrological and construction examination clauses based on instrument accuracy class (Class I, II, III, IIII) and configuration.
- **Server-Authoritative Calculations**: Instant turning-point math ($P = I + 0.5e - \Delta L$), raw error calculation ($E = P - L$), and corrected error computation ($E_c = E - E_0$) compared against statutory Table 6 MPE limits.
- **Official Report Exporter**: Real-time generation of OIML-compliant Type Examination Certificates and full procedural test dossiers in both **PDF** and **Word (DOCX)** formats.
- **Cryptographic Audit Trail (ISO 17025 §8.5)**: Immutable SHA-256 hash-chained event ledger guaranteeing tamper-proof testing histories.
- **Public QR Verification Portal**: Instant cryptographic certificate verification with dynamic revocation validation.
- **Hardware Integration**: WebSerial API protocol support for live laboratory digital balances, mass comparators, and environmental data loggers.

---

## 🏗️ Architecture

- **Frontend**: Next.js 16 (Turbopack, React 19, Tailwind CSS, Recharts, Lucide Icons)
- **Backend API**: Express & Node.js Server-Authoritative Metrology Engine
- **Database**: PostgreSQL / Supabase with custom enums, MPE stored procedures, and audit hash triggers
- **Testing**: Vitest comprehensive test suite (230 tests passing across 20 suites)

---

## 🚀 Getting Started

### Local Development

1. **Install dependencies**:
   ```bash
   npm install
   cd backend && npm install && cd ..
   ```

2. **Start the application**:
   ```bash
   # Start frontend (Next.js)
   npm run dev

   # Start backend API (Express)
   npm run dev:backend
   ```

3. **Open the browser**:
   Visit [http://localhost:3000](http://localhost:3000)

4. **Run the Automated Test Suite**:
   ```bash
   npm test
   ```

---

## 📜 Standards & Compliance
- **OIML R 76-1:2006 (E)**: Non-automatic weighing instruments - Part 1: Metrological and technical requirements - Tests
- **OIML R 76-2:2007 (E)**: Part 2: Test report format
- **ISO/IEC 17025:2017**: General requirements for the competence of testing and calibration laboratories
