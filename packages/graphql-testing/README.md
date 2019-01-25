# `@shopify/graphql-testing`

[![Build Status](https://travis-ci.org/Shopify/quilt.svg?branch=master)](https://travis-ci.org/Shopify/quilt)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE.md) [![npm version](https://badge.fury.io/js/%40shopify%2Fgraphql-testing.svg)](https://badge.fury.io/js/%40shopify%2Fgraphql-testing.svg)

Utilities to create mock graphql factory.

## Installation

```bash
$ yarn add @shopify/graphql-testing
```

## Usage

The following is an example of how to use `createGraphQLFactory` in your test.

Typically you will want to generalized some of those implementation (ie. mouting of `ApolloProvider`) for repeated use.

```ts
import {mount} from 'enzyme';
import {ApolloProvider} from 'react-apollo';
import createGraphQLFactory from '@shopify/graphql-testing';

export const createGraphQL = createGraphQLFactory();

it('load mock data from graphql', async () => {
  const mockCustomerData = {firstName: 'Jane', lastName: 'Doe'};
  const graphQL = createGraphQL({
    CustomerDetails: {
      customer: mockCustomerData,
    },
  });

  const customerDetails = mount(
    <ApolloProvider client={graphQL.client}>
      <CustomerDetails id="123" />
    </ApolloProvider>,
  );

  await graphQL.resolveAll();
  customerDetails.update();

  expect(customerDetails.find(TextField)).toHaveProp(
    'value',
    mockCustomerData.firstName,
  );
});
```
