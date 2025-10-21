# Security Policy

## Supported Versions

We actively support the following versions of Redis Explorer with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Redis Explorer seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: [security@redis-explorer.com] (replace with actual email)

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

### What to Include

Please include the following information in your report:

- Type of issue (e.g. buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit the issue

### Response Process

1. **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 48 hours
2. **Investigation**: We will investigate and validate the vulnerability
3. **Fix Development**: We will develop a fix for confirmed vulnerabilities
4. **Disclosure**: We will coordinate disclosure with you
5. **Release**: We will release the security fix and publish a security advisory

### Preferred Languages

We prefer all communications to be in English.

## Security Best Practices

When using Redis Explorer, please follow these security best practices:

### Connection Security
- Always use SSL/TLS for Redis connections in production
- Use strong passwords for Redis authentication
- Limit network access to Redis servers
- Use Redis AUTH command for authentication

### Application Security
- Keep Redis Explorer updated to the latest version
- Use environment variables for sensitive configuration
- Run Redis Explorer behind a reverse proxy with proper authentication
- Regularly audit your Redis configurations

### Data Protection
- Encrypt sensitive data at rest
- Use Redis ACLs to limit command access
- Monitor Redis logs for suspicious activity
- Implement proper backup and recovery procedures

## Known Security Considerations

### Redis Connection Storage
- Connection passwords are encrypted using AES-192 before storage
- Connection data is stored server-side, not in browser localStorage
- Ensure proper file system permissions on the server

### Network Security
- Redis Explorer communicates with Redis servers directly
- All Redis commands are executed server-side
- WebSocket connections (if enabled) should use WSS in production

### Authentication
- Redis Explorer does not implement user authentication by default
- Consider implementing authentication at the reverse proxy level
- Use Redis AUTH for database-level authentication

## Security Updates

Security updates will be released as patch versions and announced through:
- GitHub Security Advisories
- Release notes
- Project README

## Acknowledgments

We would like to thank the following individuals for responsibly disclosing security vulnerabilities:

- [List will be updated as reports are received and resolved]

## Contact

For any questions about this security policy, please contact us at [security@redis-explorer.com] (replace with actual email).
