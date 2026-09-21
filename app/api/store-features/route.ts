import {getStoreFeatures} from '@/lib/store-features';
export const dynamic='force-dynamic';
export async function GET() {
 return Response.json(await getStoreFeatures(),{headers:{'Cache-Control':'no-store'}});
}
