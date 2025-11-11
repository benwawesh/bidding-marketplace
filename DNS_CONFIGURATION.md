# DNS Configuration to Fix Email Spam Issues

## Problem
Emails from BidSoko are going to spam because:
1. SPF record doesn't include SendGrid
2. DMARC policy is too weak
3. Missing proper email authentication

## DNS Records to Update

### 1. SPF Record (TXT Record)
**Type:** TXT
**Name:** @ (or bidsoko.com)
**Current Value:** `v=spf1 include:spf.efwd.registrar-servers.com ~all`
**New Value:** `v=spf1 include:spf.efwd.registrar-servers.com include:sendgrid.net ~all`

**What this does:** Authorizes SendGrid to send emails on behalf of bidsoko.com

### 2. DMARC Record (TXT Record)
**Type:** TXT
**Name:** _dmarc
**Current Value:** `v=DMARC1; p=none;`
**New Value:** `v=DMARC1; p=quarantine; pct=100; rua=mailto:support@bidsoko.com; ruf=mailto:support@bidsoko.com; fo=1;`

**What this does:**
- `p=quarantine` - Tells receiving servers to quarantine suspicious emails (not reject completely)
- `pct=100` - Apply policy to 100% of emails
- `rua=` - Send aggregate reports to support email
- `ruf=` - Send forensic reports to support email
- `fo=1` - Generate reports if any authentication mechanism fails

### 3. Verify DKIM is Working
**Check:** s1._domainkey.bidsoko.com
**Current:** ✓ Already configured (points to SendGrid)
**Status:** No changes needed

CNAME: `s1._domainkey.bidsoko.com` → `s1.domainkey.u56117985.wl236.sendgrid.net.`

## How to Update DNS Records

### If using Namecheap, GoDaddy, or similar:
1. Log in to your domain registrar
2. Go to DNS Management for bidsoko.com
3. Find the existing TXT records
4. Edit the SPF record (@) to include SendGrid
5. Edit the DMARC record (_dmarc) with the new policy
6. Save changes

### DNS Propagation
- Changes can take 1-48 hours to propagate globally
- Most changes take effect within 1-4 hours

## SendGrid Configuration (Already Done ✓)
- [x] Sender Authentication configured
- [x] Domain Authentication (DKIM) configured
- [x] Using proper from email (noreply@bidsoko.com)
- [x] Reply-to set (support@bidsoko.com)

## Email Code Improvements (Already Done ✓)
- [x] Added unsubscribe links to all emails
- [x] Added List-Unsubscribe headers (RFC 2369)
- [x] Added physical address in footer
- [x] Disabled click tracking (avoids SendGrid redirects)
- [x] Both plain text and HTML versions
- [x] Professional email formatting

## Verification After DNS Changes

### Test SPF Record:
```bash
dig +short TXT bidsoko.com | grep "v=spf1"
```
Should show: `"v=spf1 include:spf.efwd.registrar-servers.com include:sendgrid.net ~all"`

### Test DMARC Record:
```bash
dig +short TXT _dmarc.bidsoko.com
```
Should show: `"v=DMARC1; p=quarantine; pct=100; rua=mailto:support@bidsoko.com; ruf=mailto:support@bidsoko.com; fo=1;"`

### Test DKIM Record:
```bash
dig +short CNAME s1._domainkey.bidsoko.com
```
Should show: `s1.domainkey.u56117985.wl236.sendgrid.net.`

## Additional Recommendations

### 1. SendGrid Sender Verification
- Verify your sender identity in SendGrid dashboard
- Go to Settings → Sender Authentication
- Complete domain authentication wizard

### 2. Monitor Email Deliverability
- Check SendGrid dashboard for bounce rates
- Monitor spam reports
- Review DMARC reports sent to support@bidsoko.com

### 3. Email Best Practices (Already Implemented ✓)
- Use real "From" address (not noreply@ if possible, but acceptable for transactional)
- Include unsubscribe link
- Include physical address
- Send both HTML and plain text
- Don't use spam trigger words in subject lines
- Keep email size reasonable (< 100KB)

## Timeline
1. **Immediate (Done):** Code changes deployed to add unsubscribe links and headers
2. **Within 24 hours:** Update DNS records (SPF and DMARC)
3. **After DNS propagation:** Test email deliverability
4. **Ongoing:** Monitor DMARC reports and adjust if needed

## Support
If you need help updating DNS records, contact your domain registrar support with this document.

---
**Last Updated:** 2025-11-11
**Status:** DNS records need to be updated by domain administrator
