export class NotLoggedInError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'NotLoggedInError';
  }
}

export class ProjectNotFoundError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'ProjectNotFoundError';
  }
}

export class TemplateNotFoundError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'TemplateNotFoundError';
  }
}

export class CelloServerConnectionError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'CelloServerConnectionError';
  }
}
