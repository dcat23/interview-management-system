import React from 'react';
import { render } from '@testing-library/react';
import Page from '../app/(marketing)/page';

describe('Page', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<Page params={Promise.resolve({})} />);
    expect(baseElement).toBeTruthy();
  });
});
