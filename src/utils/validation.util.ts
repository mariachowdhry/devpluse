/**
 * Lightweight, dependency-free validation helpers.
 * Each function returns an error string, or null if the value is valid.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function validateEmail(email: unknown): string | null {
  if (!isNonEmptyString(email)) return 'email is required';
  if (!EMAIL_REGEX.test(email)) return 'email must be a valid email address';
  return null;
}

export function validatePassword(password: unknown): string | null {
  if (!isNonEmptyString(password)) return 'password is required';
  if (password.length < 6) return 'password must be at least 6 characters';
  return null;
}

export function validateName(name: unknown): string | null {
  if (!isNonEmptyString(name)) return 'name is required';
  if (name.length > 255) return 'name must be at most 255 characters';
  return null;
}

export function validateRole(role: unknown): string | null {
  if (role === undefined) return null; // optional, defaults to contributor
  if (role !== 'contributor' && role !== 'maintainer') {
    return 'role must be either "contributor" or "maintainer"';
  }
  return null;
}

export function validateTitle(title: unknown): string | null {
  if (!isNonEmptyString(title)) return 'title is required';
  if (title.length > 150) return 'title must be at most 150 characters';
  return null;
}

export function validateDescription(description: unknown): string | null {
  if (!isNonEmptyString(description)) return 'description is required';
  if (description.trim().length < 20) return 'description must be at least 20 characters';
  return null;
}

export function validateIssueType(type: unknown): string | null {
  if (!isNonEmptyString(type)) return 'type is required';
  if (type !== 'bug' && type !== 'feature_request') {
    return 'type must be either "bug" or "feature_request"';
  }
  return null;
}

export function validateIssueStatus(status: unknown): string | null {
  if (status === undefined) return null;
  if (status !== 'open' && status !== 'in_progress' && status !== 'resolved') {
    return 'status must be one of "open", "in_progress", "resolved"';
  }
  return null;
}
