# PF Advogados ERP — Deployment Runbook

## Pre-Deploy Checklist

### Authentication & Security
- [ ] Azure AD app registration created (portal.azure.com)
- [ ] Redirect URI set: `https://erp.pfadvogados.com.br/api/auth/callback/microsoft-entra-id`
- [ ] AUTH_SECRET generated: `openssl rand -base64 32`
- [ ] AUTH_SECRET is unique per environment (prod != staging != dev)
- [ ] AZURE_ROLE_MAP env var set with all user emails + roles
- [ ] RBAC verified: advogado cannot access /cofre, /aprovacoes
- [ ] Rate limiting active on login (5/15min) and mutations (60/min)

### Database
- [ ] Neon (or Supabase) PostgreSQL provisioned
- [ ] DATABASE_URL set in Vercel env vars (production scope)
- [ ] Schema pushed: `npm run db:migrate`
- [ ] Production seed run: `npm run db:seed-prod`
- [ ] No test/fake data in production DB
- [ ] Backup plan: Neon PITR enabled (7 days minimum)

### Core Functionality
- [ ] Create lead → appears in pipeline → convert to case
- [ ] Log time entry → submit → approve → appears in billing
- [ ] Generate pre-invoice → approve → emits stub NFSe → AR title created
- [ ] DRE loads from real data
- [ ] Dashboard notifications derive from real DB state

### Observability
- [ ] `/api/health` returns 200 with DB status
- [ ] Error boundaries show user-friendly message (not stack trace)
- [ ] Global error.tsx and not-found.tsx render correctly

### Operations
- [ ] Vercel preview deploy works (push to branch → preview URL)
- [ ] Rollback: revert to previous Vercel deployment in <2 min

---

## Deploy Steps (Vercel + Neon)

```bash
# 1. Push to main (triggers Vercel deploy)
git push origin main

# 2. Verify health check
curl https://erp.pfadvogados.com.br/api/health

# 3. Verify login
# → Open https://erp.pfadvogados.com.br
# → Should redirect to Microsoft sign-in
# → After login, should land on /dashboard

# 4. Check Vercel logs for errors
# → Vercel Dashboard → Project → Deployments → Runtime Logs
```

---

## Rollback

1. Go to Vercel Dashboard → Deployments
2. Find previous successful deployment
3. Click "..." → "Promote to Production"
4. Verify `/api/health` returns 200

---

## Environment-Specific Notes

### Development
- Mock credentials enabled (`NODE_ENV=development`)
- Local Docker PostgreSQL (docker-compose.yml)
- All adapters are stubs

### Production
- Azure AD only (mock credentials disabled)
- Neon PostgreSQL with connection pooling
- Stubs: NFSE_ADAPTER=stub, GDRIVE_ADAPTER=stub, AI_ADAPTER=stub
- Session expires after 8 hours
- Secure cookies (HttpOnly, SameSite=lax, Secure)

---

## Phased Module Rollout

| Week | Module | Users | Acceptance |
|------|--------|-------|------------|
| 1 | Login + Dashboard + CRM | Socios | Create leads, move pipeline |
| 2 | Cases + Time Tracking | Socios + advogados | Create cases, log time |
| 3 | Approvals + Billing | Socios + financeiro | Approve time, generate pre-invoices |
| 4 | Finance + DRE + Cofre | Socios + financeiro | Manage AP, view DRE |

---

## Support

- Bug reports: WhatsApp group "ERP Bugs" (screenshot + description)
- Triage: Daily 15min review (Week 1-2), then weekly
- Hotfix SLA: Critical (auth/data) = same day; Major = next day; Minor = next sprint
