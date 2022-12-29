class Test {
  static {
    console.log(this.name);
  }

  static {
    console.log(this.name);
  }
}

new Test();
// Output:
// Test
// Teest