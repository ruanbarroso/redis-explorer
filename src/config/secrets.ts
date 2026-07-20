/**
 * Required secrets, resolved once and validated on first use.
 *
 * These used to fall back to literals committed to this public repository.
 * Every deployment that did not set the environment variables therefore ran
 * on values any reader could look up: JWT_SECRET let anyone mint a valid
 * session token, and REDIS_EXPLORER_KEY is the key that encrypts the Redis
 * credentials users save, so those credentials were recoverable by anyone
 * holding the connections file.
 *
 * Resolution is lazy: the error is raised the first time a secret is actually
 * needed, not at import time, so a build or test run without the variables set
 * still succeeds. Requests that need a secret fail loudly instead. A silent
 * insecure default is worse than an outage, because the operator cannot tell
 * the difference between "configured" and "wide open".
 */

const MIN_LENGTH = 32;

function required(name: string): string {
  const value = process.env[name];

  if (!value || value.trim() === '') {
    throw new Error(
      `${name} is not set. Generate one with "openssl rand -base64 48" and ` +
        `pass it to the app (docker run -e ${name}=... / your orchestrator's ` +
        `secret mechanism). This app no longer ships a default: earlier ` +
        `versions fell back to a literal committed to a public repository.`,
    );
  }

  if (value.length < MIN_LENGTH) {
    throw new Error(
      `${name} is shorter than ${MIN_LENGTH} characters. Use a high-entropy ` +
        `value, for example "openssl rand -base64 48".`,
    );
  }

  return value;
}

/** Signs and verifies session JWTs. */
export function jwtSecret(): string {
  return required('JWT_SECRET');
}

/**
 * Encrypts stored Redis connection passwords.
 *
 * Rotating this value makes previously saved connection passwords
 * undecryptable; they have to be re-entered. Deployments that were running on
 * the old built-in default must rotate, and should treat any Redis credential
 * saved under it as compromised.
 */
export function encryptionKey(): string {
  return required('REDIS_EXPLORER_KEY');
}
