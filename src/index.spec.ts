import { version } from './index';

describe('index', () => {
  it('should give proper version', () => {
    expect(version).toBe('2.0.0-rc');
  });
});
