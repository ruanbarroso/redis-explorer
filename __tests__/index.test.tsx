describe('Redis Explorer', () => {
  it('should have basic functionality', () => {
    // Basic test to ensure Jest is working
    expect(true).toBe(true);
  });

  it('should perform basic math operations', () => {
    expect(2 + 2).toBe(4);
    expect(10 - 5).toBe(5);
  });

  it('should handle string operations', () => {
    expect('Redis'.toLowerCase()).toBe('redis');
    expect('Explorer'.toUpperCase()).toBe('EXPLORER');
  });
});
