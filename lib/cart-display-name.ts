// Presentation only: keep the original order and catalog data unchanged.
export function cartDisplayName(name:string){
 return name.replace(/\s*[·—–-]?\s*sin proporción garantizada por género o edad/gi,'').trim();
}
