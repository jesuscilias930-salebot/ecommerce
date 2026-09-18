export function BoxArt({tone=0,large=false}:{tone?:number;large?:boolean}) {
 return <div className={`box-art tone-${tone} ${large?'large':''}`} role="img" aria-label="Ilustración de paquete de calcetines; no representa el surtido real"><div className="art-circle"/><div className="socks">{[0,1,2,3,4].map(n=><i key={n} style={{'--i':n} as React.CSSProperties}/>)}</div><div className="parcel"><span>MERLYN<br/><small>HECHO PARA EMPRENDER</small></span></div><span className="art-caption">ILUSTRACIÓN · SURTIDO POR CONFIRMAR</span></div>;
}
