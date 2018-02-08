import { version } from './index';

describe('index', () => {
  it('should give proper version', () => {
    expect(version).toBe('1.4.0-rc');
  });
});
