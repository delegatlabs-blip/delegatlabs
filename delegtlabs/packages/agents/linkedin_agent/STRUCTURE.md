# LinkedIn agent layout

```
linkedin_agent/
├── AUTH.md                 # user sign-in / tenancy
├── CHANGELOG.md            # TS-8: USER Overview + GET /tenant/overview gone; catalog
├── README.md
├── STRUCTURE.md
├── backend/
│   ├── app/
│   │   ├── api/endpoints/
│   │   │   ├── tenant.py   # GET /tenant/catalog, GET /tenant/credits; no GET /tenant/overview
│   │   │   └── admin.py    # GET /admin/catalog; POST/PATCH plans, packs, action_costs
│   │   ├── services/billing.py
│   │   └── db/migrations/  # 010–013 catalog; 019 credit packs; 012 dual price; 013 locked seed
│   └── tests/              # TS-8 pytest (overview removal, catalog, seed, static docs)
└── frontend/
    ├── shared/api/index.ts # tenantApi.catalog; no tenantApi.overview; adminApi catalog writes
    ├── user/src/
    │   ├── App.tsx         # /dashboard → /dashboard/agents/post-gen
    │   └── pages/agents/post-gen/  # SubscriptionTab + CreditsTab from catalog
    └── admin/src/
        ├── App.tsx         # /billing catalog page; /overview home stays
        └── pages/Billing.tsx
```

TS-8 removed the USER Overview surface and `GET /tenant/overview`. Catalog SKUs live in PostgreSQL (`subscription_plans`, `credit_packs`, `credit_action_costs`) with dual `price_inr_minor` / `price_usd_minor`. See [README.md](README.md) and [CHANGELOG.md](CHANGELOG.md).
