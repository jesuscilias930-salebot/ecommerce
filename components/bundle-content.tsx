import type { Package } from "@/lib/catalog";
import { money } from "@/lib/money";

export function BundleContent({ item, showHeading = true }: { item: Package; showHeading?: boolean }) {
  return (
    <section className="bundle-breakdown">
      {showHeading && <h3>Todo lo que incluye tu caja</h3>}
      <p>
        {item.items.length} productos · {item.pieces} unidades (pares de calcetines o shorts)
      </p>
      <div className="bundle-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Piezas</th>
              <th>Referencia / unidad</th>
              <th>Importe</th>
            </tr>
          </thead>
          <tbody>
            {item.items.map((i, n) => (
              <tr key={i.id ?? n}>
                <td>{i.name}</td>
                <td>{i.quantity}</td>
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
      <small>
        El precio final suma cajas e individuales por categoría combinable. En deportivos y licra, el volumen se calcula por producto. Shorts caballero con y sin cierre combinan entre sí; dama por separado. Consulta el total actualizado al elegir la cantidad.
      </small>
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
