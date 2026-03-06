# Security Hardening Guide

## 1. Overview

A security audit of the Data Center Lab Simulator scored **8.3/10**. Code-level fixes have already been applied, including a Content Security Policy (CSP) meta tag in `index.html` and input validation on verification and password-reset codes. This guide covers the remaining infrastructure-level hardening steps that require deployment configuration changes rather than code changes.

## 2. MFA Enablement

### Current State

Multi-factor authentication is currently disabled in the Cognito user pool:

```
mfa_configuration: "NONE"
```

### How to Enable

Edit `amplify/auth/resource.ts` to add TOTP-based MFA:

```typescript
import { defineAuth } from "@aws-amplify/backend";

export const auth = defineAuth({
  loginWith: { email: true },
  multifactor: {
    mode: "OPTIONAL",
    totp: true,
  },
});
```

### Deploying the Change

- **Development:** Run `npx ampx sandbox` to deploy the updated auth configuration.
- **Production:** Deploy via your CI/CD pipeline (e.g., push to the connected branch in AWS Amplify Hosting).

### Mode Options

- `OPTIONAL` -- Users can opt in to MFA from their account settings. This is the recommended starting point since it avoids disrupting existing users.
- `REQUIRED` -- Forces MFA for all users. Every sign-in will require a TOTP code. Only use this if your security requirements mandate it.

## 3. Unauthenticated Identities

### Current State

```
unauthenticated_identities_enabled: true
```

### Explanation

This setting allows anonymous (unauthenticated) users to receive temporary AWS credentials scoped by an IAM role. For this application, unauthenticated access is **intentional** -- the simulator works without sign-in, and only authenticated users gain the ability to sync their learning progress to the cloud.

The temporary credentials granted to unauthenticated users are tightly scoped by the Amplify-generated IAM role and do not provide access to sensitive resources.

### If You Want to Restrict Access

If your deployment requires that all API access be limited to authenticated users only, disable unauthenticated identities in the Amplify backend configuration. Be aware that this will prevent the simulator from functioning for users who have not signed in.

## 4. Server-Side Security Headers

### Current State

CSP is already enforced via a `<meta>` tag in `index.html`. However, several other security headers should be set at the server level for defense in depth.

### Configuration for AWS Amplify Hosting

Create (or update) `customHttp.yml` in the project root:

```yaml
customHeaders:
  - pattern: "**/*"
    headers:
      - key: Strict-Transport-Security
        value: "max-age=31536000; includeSubDomains"
      - key: X-Content-Type-Options
        value: "nosniff"
      - key: X-Frame-Options
        value: "DENY"
      - key: Referrer-Policy
        value: "strict-origin-when-cross-origin"
```

### Header Descriptions

| Header                      | Purpose                                                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `Strict-Transport-Security` | Ensures browsers only connect over HTTPS for one year, including subdomains.                                                               |
| `X-Content-Type-Options`    | Prevents browsers from MIME-sniffing responses away from the declared content type.                                                        |
| `X-Frame-Options`           | Prevents the site from being embedded in iframes. This is a fallback for browsers that do not support the CSP `frame-ancestors` directive. |
| `Referrer-Policy`           | Sends the origin (but not the full URL path) when navigating to external sites over HTTPS.                                                 |

**Note:** The CSP header is intentionally omitted from `customHttp.yml` because it is already set via the meta tag in `index.html`. Managing CSP in one place avoids conflicts between duplicate policies.

## 5. npm audit in CI/CD

### Adding to GitHub Actions

Add the following step to your GitHub Actions workflow **before** the build step:

```yaml
- name: Security audit
  run: npm audit --audit-level=moderate
```

This will fail the build if any dependency has a known vulnerability rated `moderate` or higher.

### Alternative: package.json Script

Add a script to `package.json` for local use:

```json
{
  "scripts": {
    "audit": "npm audit --audit-level=moderate"
  }
}
```

Run it locally with `npm run audit` to check for vulnerabilities before pushing.

## 6. Dependency Update Cadence

- **Monthly:** Run `npm outdated` to review available updates across all dependencies.
- **Minor and patch updates** (covered by `^` ranges in `package.json`) are generally backwards-compatible and can be applied together after running tests.
- **Major version bumps** should be reviewed and tested individually, as they may contain breaking changes.
- **Automated safety net:** With `npm audit` in CI (see section 5), known vulnerabilities in dependencies will be caught automatically on every build, even between manual update cycles.
