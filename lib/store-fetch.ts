// Server callers supply fixed endpoint paths. Never log response bodies, URLs, cookies or credentials.
export async function storeFetch(url:string,endpoint:string,options:RequestInit):Promise<Response>{
 const started=Date.now();
 try{
  const response=await fetch(url,options);
  if(!response.ok){
   const code=response.headers.get('X-Store-Error-Code');
   const requestId=response.headers.get('X-Store-Request-Id');
   console.warn('Store upstream request failed',{
    endpoint:endpoint.split('?')[0],status:response.status,durationMs:Date.now()-started,
    code:code&&/^STORE_[A-Z_]{1,60}$/.test(code)?code:undefined,
    requestId:requestId&&/^[a-f0-9-]{36}$/.test(requestId)?requestId:undefined,
   });
  }
  return response;
 }catch(error){
  console.warn('Store upstream request failed',{
   endpoint:endpoint.split('?')[0],durationMs:Date.now()-started,
   reason:error instanceof Error&&error.name==='TimeoutError'?'timeout':error instanceof Error&&error.name==='AbortError'?'aborted':'connection_failure',
  });
  throw error;
 }
}
