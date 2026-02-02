# rental-system

A lightweight property rental management system (no framework). This repository contains a simple HTTP server, a client-side SPA, and a SQLite database for properties and customers.

**DFD Diagrams**

**Level 0 (Context Diagram)**

This context diagram shows the `Rental System` as a single central process interacting with external actors.

```mermaid
graph LR
  Owner[Property Owner]
  Tenant[Customer / Tenant]
  Admin[Administrator]
  PaymentGateway[Payment Gateway]
  System((Rental System))

  Owner -->|Manage properties| System
  Tenant -->|Search / Book / View Billing| System
  Admin -->|Configure / Reports| System
  System -->|Process payments| PaymentGateway
```

**Level 1 DFD**

Breaks the central process into major sub-processes, data flows, and data stores.

```mermaid
graph LR
  subgraph Rental_System[Rental System]
    PM[Property Management]
    CM[Customer Management]
    BP[Billing & Payments]
    RP[Reporting]
  end

  Owner[Property Owner] -->|create/update| PM
  Tenant[Customer] -->|register/book| CM
  CM -->|customer data| DB_Customers[(Customers DB)]
  PM -->|property data| DB_Properties[(Properties DB)]
  BP -->|billing records| DB_Billing[(Billing DB)]
  CM -->|trigger billing| BP
  PM -->|availability| BP
  RP -->|reads| DB_Properties
  RP -->|reads| DB_Customers
  RP -->|reads| DB_Billing
```

**Level 2 DFD (Billing & Payments decomposition)**

Detailed view of the `Billing & Payments` subprocess showing invoice generation, payment processing, and updates to data stores.

```mermaid
graph LR
  CustomerData[Customer Data]
  PropertyData[Property Data]
  GenerateInvoice[1. Generate Invoice]
  SendInvoice[2. Send Invoice / Notify Customer]
  ReceivePayment[3. Receive Payment]
  VerifyPayment[4. Verify Payment]
  UpdateRecords[5. Update Billing & Property Status]
  Receipt[Receipt / Confirmation]

  CustomerData --> GenerateInvoice
  PropertyData --> GenerateInvoice
  GenerateInvoice --> SendInvoice
  SendInvoice --> CustomerData
  CustomerData --> ReceivePayment
  ReceivePayment --> VerifyPayment
  VerifyPayment --> UpdateRecords
  UpdateRecords --> DB_Billing[(Billing DB)]
  UpdateRecords --> DB_Properties[(Properties DB)]
  VerifyPayment --> Receipt
```

Notes:
- GitHub renders Mermaid diagrams in Markdown; view these diagrams on GitHub or a compatible Markdown renderer.
- The diagrams show conceptual data flows; adapt them as needed to match implementation details.
# rental-system