// Public, merchant-approved information only. No private customer data.
export const COMMUNITY_URL='https://chat.whatsapp.com/FfHJ6u4q06MEEmnlprWgY4?mode=gi_t';
// Public customer-support number explicitly approved by the merchant.
export const SUPPORT_URL:string='https://wa.me/522721285563';
export const storePolicies:{preparation:string;returns:string;hours:string}={preparation:'',returns:'',hours:''};
export type CustomerReference={id:string;quote:string;publicName:string;city?:string;date?:string;photoUrl?:string;photoAlt?:string;bundleId?:number;publicationApproved:boolean;published:boolean};
export const customerReferences:CustomerReference[]=[];
export function publishedReferences(bundleId?:number){return customerReferences.filter(r=>r.publicationApproved&&r.published&&r.quote.trim()&&r.publicName.trim()&&(bundleId===undefined||r.bundleId===bundleId));}
