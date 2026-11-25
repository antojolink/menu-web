export function onRequest(context, next) {
  if (import.meta.env.DEV && context.url.pathname !== '/' && !context.url.pathname.includes('.')) {
    return context.rewrite('/');
  }
  return next();
}
