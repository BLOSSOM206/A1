/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../App';

const waitForProps = async (
  root: ReactTestRenderer.ReactTestInstance,
  props: Record<string, unknown>,
) => {
  let match: ReactTestRenderer.ReactTestInstance | undefined;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    match = root.findAllByProps(props)[0];

    if (match) {
      return match;
    }

    await ReactTestRenderer.act(async () => {
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 10));
    });
  }

  throw new Error(`No instance found with props: ${JSON.stringify(props)}`);
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});

test('navigates from login to signup and back', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });

  const root = renderer!.root;
  const createAccountButton = await waitForProps(root, {
    accessibilityLabel: 'Go to sign up',
  });

  await ReactTestRenderer.act(async () => {
    createAccountButton.props.onPress();
  });

  expect(await waitForProps(root, { accessibilityLabel: 'Full name' })).toBeTruthy();
  expect(await waitForProps(root, { accessibilityLabel: 'Create account' })).toBeTruthy();

  const backToLoginButton = await waitForProps(root, {
    accessibilityLabel: 'Back to login',
  });

  await ReactTestRenderer.act(async () => {
    backToLoginButton.props.onPress();
  });

  expect(await waitForProps(root, { accessibilityLabel: 'Email' })).toBeTruthy();
  expect(await waitForProps(root, { accessibilityLabel: 'Go to sign up' })).toBeTruthy();
});
