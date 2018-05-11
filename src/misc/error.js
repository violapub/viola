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
