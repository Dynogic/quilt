import {GraphQLRequest, ApolloLink, Operation, Observable} from 'apollo-link';
import {
  ApolloReducerConfig,
  InMemoryCache,
  IntrospectionFragmentMatcher,
} from 'apollo-cache-inmemory';
import ApolloClient from 'apollo-client';

import MockApolloLink from './MockApolloLink';
import Requests from './Requests';
import {GraphQLMock} from './types';

export interface Options {
  unionOrIntersectionTypes?: any[];
  cacheOptions?: ApolloReducerConfig;
}

export interface GraphQLClientOptions {
  ssrMode?: boolean;
}

function defaultGraphQLMock({operationName}: GraphQLRequest) {
  return new Error(
    `Can’t perform GraphQL operation '${operationName ||
      ''}' because no mocks were set.`,
  );
}

export type MockGraphQLClient = ApolloClient<unknown> & {
  graphQLRequests: Requests;
  graphQLResults: Requests;
};

interface MockRequest {
  operation: Operation;
  resolve(): Promise<void>;
}

class GraphQL {
  private mockClient: ApolloClient<unknown>;
  private requests = new Set<MockRequest>();
  private incompleteRequests = new Set<MockRequest>();
  private afterResolver: (() => void) | undefined;

  constructor(
    mock: GraphQLMock,
    {unionOrIntersectionTypes = [], cacheOptions = {}}: Options = {},
  ) {
    const cache = new InMemoryCache({
      fragmentMatcher: new IntrospectionFragmentMatcher({
        introspectionQueryResultData: {
          __schema: {
            types: unionOrIntersectionTypes,
          },
        },
      }),
      ...cacheOptions,
    });

    const mockLink = new MockApolloLink(mock);

    const memoryLink = new ApolloLink((operation, forward) => {
      if (forward == null) {
        return null;
      }

      let resolver: Function;

      const promise = new Promise<void>(resolve => {
        resolver = resolve;
      });

      const request = {
        operation,
        resolve: () => {
          resolver();
          this.incompleteRequests.delete(request);

          return promise;
        },
      };

      this.requests.add(request);
      this.incompleteRequests.add(request);

      return new Observable(observer => {
        return forward(operation).subscribe({
          complete() {
            const complete = observer.complete.bind(observer);
            promise.then(complete).catch(complete);
          },
          next(result) {
            const next = observer.next.bind(observer, result);
            promise.then(next).catch(next);
          },
          error(error) {
            const fail = observer.error.bind(observer, error);
            promise.then(fail).catch(fail);
          },
        });
      });
    });

    const client = new ApolloClient({
      link: memoryLink.concat(mockLink),
      cache,
    });

    this.mockClient = client;
  }

  get client(): MockGraphQLClient {
    const client = this.mockClient as MockGraphQLClient;
    client.graphQLRequests = new Requests(
      Array.from(this.requests).map(mockRequest => mockRequest.operation),
    );
    client.graphQLResults = new Requests(
      Array.from(this.incompleteRequests).map(
        mockRequest => mockRequest.operation,
      ),
    );
    return client;
  }

  afterResolve(resolver: () => void) {
    this.afterResolver = resolver;
  }

  async resolveAll() {
    await Promise.all(
      Array.from(this.incompleteRequests).map(({resolve}) => resolve()),
    );

    if (this.afterResolver) {
      this.afterResolver();
    }
  }
}

export default function createGraphQLFactory(options?: Options) {
  return function createGraphQLClient(mock: GraphQLMock = defaultGraphQLMock) {
    return new GraphQL(mock, options);
  };
}
