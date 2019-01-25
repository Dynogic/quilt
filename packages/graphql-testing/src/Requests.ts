import {Operation} from 'apollo-link';

export default class Requests {
  private requests: Operation[] = [];

  constructor(requests?: Operation[]) {
    this.requests = requests ? [...requests] : [];
  }

  get last() {
    return this.requests[this.requests.length - 1];
  }

  [Symbol.iterator]() {
    return this.requests[Symbol.iterator]();
  }

  nth(index: number) {
    return index < 0
      ? this.requests[this.requests.length - 1 + index]
      : this.requests[index];
  }

  push(request: Operation) {
    this.requests.push(request);
  }

  allOperations(): Operation[] {
    return this.requests;
  }

  allWithOperationName(operation: string): Operation[] {
    const allMatchedOperations = this.requests.filter(
      req => req.operationName === operation,
    );

    return allMatchedOperations;
  }

  lastOperation(operation: string): Operation {
    const lastOperation = this.requests
      .reverse()
      .find(req => req.operationName === operation);

    if (lastOperation == null) {
      throw new Error(`no requests with operation '${operation}' were found.`);
    }

    return lastOperation;
  }
}
