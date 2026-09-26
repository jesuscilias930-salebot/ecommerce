import {NextRequest,NextResponse} from 'next/server';
export function proxy(request:NextRequest){
 if(request.cookies.get('merlyn-visitor')?.value.match(/^[a-f0-9-]{36}$/))return NextResponse.next();
 const id=crypto.randomUUID();request.cookies.set('merlyn-visitor',id);
 const response=NextResponse.next({request:{headers:request.headers}});
 response.cookies.set('merlyn-visitor',id,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:86400});
 return response;
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico).*)']};
