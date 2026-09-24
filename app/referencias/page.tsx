import {publishedReferences} from '@/lib/store-trust';
import {ReferenceCard,CommunitySection,ContactLink} from '@/components/store-trust';
import styles from '@/components/store-trust.module.css';
export const metadata={title:'Referencias y comunidad'};
export default function References(){const references=publishedReferences();return <main id="contenido"><section className="section"><span className="eyebrow">CONOCE MÁS ANTES DE COMPRAR</span><h1>Referencias de compra.</h1>{references.length?<><p className={styles.intro}>Experiencias reales compartidas con autorización. Cada pedido puede tener un surtido y tiempo de entrega distintos.</p><div className={styles.grid}>{references.map(r=><ReferenceCard key={r.id} reference={r}/>)}</div></>:<><p className={styles.intro}>Todavía no hay testimonios publicados en esta página. Puedes solicitar referencias al equipo antes de comprar.</p><ContactLink>Solicitar referencias por WhatsApp</ContactLink></>}</section><CommunitySection/></main>;}
