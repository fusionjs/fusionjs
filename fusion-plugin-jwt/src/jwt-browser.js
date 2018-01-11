export default function JWTBrowser() {
  return {
    from() {
      throw new Error('Cannot call JWT.from in the browser');
    },
  };
}
