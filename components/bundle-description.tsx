export function BundleDescription({text}:{text?:string|null}) {
  if(!text?.trim())return null;
  return <p style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',lineHeight:1.6}}>{text}</p>;
}
