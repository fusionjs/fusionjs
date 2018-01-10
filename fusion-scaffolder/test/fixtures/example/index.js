module.exports = async function getContext(ctx) {
  ctx.newData = 'bar';
  return ctx;
};
