export default function createClientRenderer({render}) {
  return function renderer(ctx, next) {
    const rendered = render(ctx.element);
    if (rendered instanceof Promise) {
      return rendered.then(r => {
        ctx.rendered = r;
        return next();
      });
    } else {
      ctx.rendered = rendered;
      return next();
    }
  };
}
