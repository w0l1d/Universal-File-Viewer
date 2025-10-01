# Automated Release Setup Guide

This guide explains how to set up automated Firefox extension publishing with GitHub Actions.

## Prerequisites

1. **Firefox Add-ons Account**
   - Create account at https://addons.mozilla.org/
   - Submit your extension manually first time
   - Note your extension GUID (found in manifest.json `browser_specific_settings.gecko.id`)

2. **AMO API Credentials**
   - Go to https://addons.mozilla.org/en-US/developers/addon/api/key/
   - Click "Generate new credentials"
   - Save the JWT Issuer and JWT Secret (shown only once!)

## Setup Steps

### 1. Add Secrets to GitHub Repository

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add these secrets:

- **AMO_JWT_ISSUER**: Your JWT Issuer from AMO
- **AMO_JWT_SECRET**: Your JWT Secret from AMO

### 2. Update Extension GUID

In `.github/workflows/release.yml`, replace `{YOUR-EXTENSION-GUID-HERE}` with your actual extension GUID from `manifest.json`:

```yaml
addon-guid: 'your-extension@example.com'
```

### 3. Ensure manifest.json has GUID

Your `manifest.json` must include:

```json
{
  "browser_specific_settings": {
    "gecko": {
      "id": "your-extension@example.com",
      "strict_min_version": "88.0"
    }
  }
}
```

### 4. Test the Workflow

Create and push a tag:

```bash
git tag -a v2.1.1 -m "Test release"
git push origin v2.1.1
```

The workflow will:
1. Run tests
2. Build the extension
3. Create GitHub Release with the .zip file
4. Submit to Firefox Add-ons Marketplace

## Workflow Triggers

The workflow runs when you push a tag matching `v*`:

```bash
# Examples that trigger the workflow
git tag -a v2.1.0 -m "Release 2.1.0"
git push origin v2.1.0

git tag -a v3.0.0-beta -m "Beta release"
git push origin v3.0.0-beta
```

## Manual Approval (Optional)

To require manual approval before publishing to AMO, modify the workflow:

```yaml
jobs:
  build-and-publish:
    runs-on: ubuntu-latest
    environment: production  # Add this line
```

Then create a "production" environment in Settings → Environments with required reviewers.

## Review Process

After submission:
1. AMO will automatically review your extension (usually 1-3 hours)
2. You'll receive email notification when review completes
3. Extension goes live automatically if approved
4. If rejected, you'll get detailed feedback

## Troubleshooting

### Error: "Could not find addon GUID"
- Check that `addon-guid` in workflow matches manifest.json
- Ensure extension was submitted to AMO at least once manually

### Error: "Invalid credentials"
- Regenerate JWT credentials on AMO
- Update GitHub secrets with new credentials

### Error: "Version already exists"
- Increment version in manifest.json
- Create new tag with matching version

### Build fails
- Run `npm test` and `npm run build` locally first
- Check that all dependencies are in package.json
- Ensure setup.js downloads all required libraries

## Alternative: Manual Release

If you prefer manual control:

1. Remove the "Publish to Firefox Add-ons" step from workflow
2. Workflow will only create GitHub Release
3. Download .zip from GitHub Releases
4. Upload manually to https://addons.mozilla.org/developers/

## Best Practices

1. **Always test locally first**:
   ```bash
   npm test
   npm run build
   npm run lint
   ```

2. **Version numbering**:
   - manifest.json version must match git tag (without 'v')
   - Example: tag `v2.1.0` → manifest version `2.1.0`

3. **Changelog**:
   - Update CHANGELOG.md before creating tag
   - Workflow includes changelog in GitHub Release

4. **Beta releases**:
   - Use tags like `v2.1.0-beta` for beta channel
   - Add `--channel=unlisted` for unlisted versions

## Security Notes

- Never commit AMO credentials to repository
- Use GitHub Secrets for all sensitive data
- Rotate JWT credentials periodically
- Limit repository access to trusted maintainers

## Additional Resources

- [AMO API Documentation](https://mozilla.github.io/addons-server/topics/api/signing.html)
- [web-ext sign documentation](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#web-ext-sign)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Firefox Extension Workshop](https://extensionworkshop.com/)