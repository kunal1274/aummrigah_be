![alt text](image.png)
![alt text](image-1.png)
![alt text](image-2.png)
![alt text](image-3.png)
![alt text](image-4.png)

How to deploy the project to vercel :
first install the vercel cli :

```bash
npm i -g vercel
```

then configure the vercel.json in the root directory of the project

```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "index.js"
    }
  ]
}
```

![alt text](image-6.png)

Locally via cli
![alt text](image-5.png)

```bash
vercel dev
```

## item model

![alt text](image-7.png)

## Ledger Mapping Model

```javascript
// 1. Create Mapping
const mapping = new LedgerMappingModel({
  code: "LM_001",
  ledgerMappingNum: "LM001",
  name: "Default Ledger Mapping",
  mapping: {
    customer: { fields: { AR: "1001", gst: "2001" } },
    vendor: { fields: { AR: "4001", tds: "6001" } },
  },
  createdBy: "admin",
});

await mapping.save();
```

```javascript
//2. Update a Mapping
javascript
Copy code
const mapping = await LedgerMappingModel.findOne({ ledgerMappingNum: "LM001" });
mapping.mapping.customer.fields.Discount = "1003";
mapping.updatedBy = "manager";
await mapping.save();
```

```javascript
//3. Query Active Mappings
javascript
Copy code
const activeMappings = await LedgerMappingModel.find({ active: true });
```

Explanation of each field :

| Field                       | Purpose                                                                             |
| --------------------------- | ----------------------------------------------------------------------------------- |
| code                        | Unique identifier for the ledger mapping.                                           |
| ledgerMappingNum            | Mandatory unique identifier, validated for specific characters.                     |
| name                        | Name of the ledger mapping.                                                         |
| mapping                     | A nested Map structure containing category mappings (e.g., customer, vendor, item). |
| active                      | Boolean to toggle the mapping's active status.                                      |
| version                     | Tracks changes to the mapping over time.                                            |
| createdBy / updatedBy       | Track user details for creation and updates.                                        |
| effectiveFrom / effectiveTo | Define the time period for which the mapping is valid.                              |
| allowOverrides              | Indicates if mappings can be overridden at the transaction level.                   |
| validationRules             | Custom validation rules for fields.                                                 |
| metadata                    | Store additional details like descriptions, notes, or flags.                        |
| categories / tags           | Organize mappings using categories or tags.                                         |
| history                     | Store historical versions of the mapping.                                           |
| fallbackMapping             | A default mapping to be used when no specific mapping is found.                     |
| externalSystemMappings      | Key-value pairs to integrate with external systems like SAP, QuickBooks, etc.       |

====
Allocation vs sales order
Analysis of the Context
Sales Order Model Context:

Represents the commercial or transactional agreement with the customer.
Often tied to customer details, items, and financial aspects like price, quantity, and discount.
Focus is on "what" is being sold or serviced rather than "how" it is being delivered.
Allocation Model Context:

Represents the operational and logistical aspects of fulfilling the sales order.
Contains details like the driver, ride number, and booking status.
Focuses on "how" the service or delivery is executed.
Recommendation
Fields and Their Placement
Field Recommended Model Reason
pickup location Sales Order Closely tied to customer/address and defines the nature of the service. Needed to confirm the order.
start date/time Allocation Represents when the driver begins the ride, a logistical detail that changes dynamically.
end date/time Allocation Represents when the ride ends, part of ride/booking execution, not the sales order.
car type Allocation Linked to driver/vehicle allocation, not directly tied to the sales order.
transmission type Allocation Same as car type, depends on the operational aspect of the ride.
