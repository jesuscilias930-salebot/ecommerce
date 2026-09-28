import type { Package } from "@/lib/catalog";
import { money } from "@/lib/money";
import {bundleVolumeMessages} from '@/lib/live-pricing';
import {packageQuantityLabel,isShort,usesTripares,triparesLabel} from '@/lib/sale-presentation';

export function BundleContent({ item, showHeading = true }: { item: Package; showHeading?: boolean }) {
  return (
    <section className="bundle-breakdown">
      {showHeading && <h3>Todo lo que incluye tu caja</h3>}
      <p>
        {item.items.length} productos · {packageQuantityLabel(item)}
      </p>
      <div className="bundle-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad y presentación</th>
              <th>Referencia / unidad</th>
              <th>Importe</th>
            </tr>
          </thead>
          <tbody>
            {item.items.map((i, n) => (
              <tr key={i.id ?? n}>
                <td>{i.name}{i.size?.trim()&&<small style={{display:'block'}}>Talla: {i.size}</small>}{i.assorted&&<small style={{display:'block'}}>Surtido de niño a adulto y todos los géneros, según existencias.</small>}</td>
                <td>{i.quantity} {isShort(i)?'piezas':'pares'}{usesTripares(i)&&<small style={{display:'block'}}>{triparesLabel(i.quantity)}</small>}</td>
                <td>
                  {i.assignedUnitPrice == null
                    ? "Por confirmar"
                    : money(i.assignedUnitPrice)}
                </td>
                <td>
                  {i.assignedUnitPrice == null
                    ? "Por confirmar"
                    : money(i.assignedUnitPrice * i.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bundle-total">
        <span>Referencia por una caja</span>
        <strong>{money(item.price)} MXN</strong>
      </div>
      <div>{bundleVolumeMessages(item).map(message=><p key={message}><small>{message}</small></p>)}</div>
      <div className="bundle-measures">
        <span>
          Dimensiones
          <br />
          <b>
            {[item.boxLengthCm, item.boxWidthCm, item.boxHeightCm].every(
              (v) => v != null,
            )
              ? `${item.boxLengthCm} × ${item.boxWidthCm} × ${item.boxHeightCm} cm`
              : "Por confirmar"}
          </b>
        </span>
        <span>
          Peso
          <br />
          <b>
            {item.boxWeightKg == null
              ? "Por confirmar"
              : `${item.boxWeightKg} kg`}
          </b>
        </span>
      </div>
    </section>
  );
}
