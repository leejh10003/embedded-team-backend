const Koa = require('koa');
const KoaRouter = require('koa-router');
const BodyParser = require('koa-bodyparser');
const app = new Koa();
app.proxy = true;
const router = new KoaRouter();
app.use(BodyParser());
router.options('healthPreflight', '/health', async (ctx) => {
	ctx.set('Access-Control-Allow-Origin', ctx.request.header.referer || ctx.request.header.origin);
	ctx.set('Access-Control-Allow-Methods', 'OPTIONS, POST, GET');
	ctx.set('Access-Control-Allow-Headers', 'Access-Control-Allow-Origin, Content-Type, Authorization');
  ctx.set('Access-Control-Allow-Credentials', true);
	ctx.response.status = 200;
})
router.get('health', '/health', async (ctx) => {
  ctx.response.body = 'OK';
  ctx.response.status = 200;
  ctx.set('Access-Control-Allow-Origin', ctx.request.header.referer || ctx.request.header.origin);
  ctx.set('Access-Control-Allow-Credentials', true);
})
app.use(router.routes())
  .use(router.allowedMethods())
  .listen(8500, () => console.log('Running on port 8500'));