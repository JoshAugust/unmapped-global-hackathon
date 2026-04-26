# Deploy Commands

The build succeeds but Cloudflare Workers deploy requires authentication.

## Option 1: Set API token and deploy
```bash
cd /Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/unmapped-global-hackathon
export CLOUDFLARE_API_TOKEN="your-token-here"
npx wrangler deploy
```

## Option 2: Interactive login (requires browser)
```bash
cd /Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/unmapped-global-hackathon
npx wrangler login
npx wrangler deploy
```

## Get a Cloudflare API token
1. Go to https://developers.cloudflare.com/fundamentals/api/get-started/create-token/
2. Create a token with "Edit Cloudflare Workers" permissions
3. Set it as `CLOUDFLARE_API_TOKEN`

## Expected result
The app will deploy to `https://unmapped.<your-account>.workers.dev`

## Custom domain (optional)
If you have `joshuaaugustine.page` configured in Cloudflare:
1. Add a route in `wrangler.jsonc`:
```json
{
  "routes": [
    { "pattern": "joshuaaugustine.page/unmapped/*", "zone_name": "joshuaaugustine.page" }
  ]
}
```
2. Or set up a custom domain in the Cloudflare Workers dashboard.
