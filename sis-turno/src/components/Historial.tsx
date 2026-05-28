import { User, Skull } from "lucide-react";
import { TurnoJugado } from "../types";

interface Props {
  historial: TurnoJugado[];
}

export function Historial({ historial }: Props) {
  return (
    <div className="historial">
      <h2 className="historial-titulo">Historial</h2>
      {historial.length === 0 ? (
        <p className="sin-datos">Sin turnos jugados</p>
      ) : (
        <ul className="historial-lista">
          {historial.map((t, i) => (
            <li key={i} className={`historial-item ${t.esJugador ? "item-jugador" : "item-enemigo"}`}>
              <span className="historial-icono">
                {t.esJugador ? <User size={12} /> : <Skull size={12} />}
              </span>
              <span className="historial-turno">T{t.turnoNumero}</span>
              <span className="historial-nombre">{t.nombre}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
