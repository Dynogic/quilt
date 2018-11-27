import querystring from 'querystring';
import {createMockContext} from '@shopify/jest-koa-mocks';

import createEnableCookies from '../create-enable-cookies';
import {readTemplate} from '../itp-template';

const query = querystring.stringify.bind(querystring);
const baseUrl = 'myapp.com/auth';
const shop = 'shop1.myshopify.io';
const shopOrigin = 'https://shop1.myshopify.io';
const apiKey = 'myapikey';

describe('CreateEnableCookies', () => {
  it('sets body to the enable cookies HTML page', () => {
    const enableCookies = createEnableCookies();
    const ctx = createMockContext({
      url: `https://${baseUrl}?${query({shop})}`,
    });

    ctx.state = {
      authRoute: baseUrl,
      apiKey,
    };

    enableCookies(ctx);

    expect(ctx.body).toContain('Enable cookies');
    expect(ctx.body).toContain(apiKey);
    expect(ctx.body).toContain(shopOrigin);
    expect(ctx.body).toContain(readTemplate('enable-cookies.js'));
  });
});
