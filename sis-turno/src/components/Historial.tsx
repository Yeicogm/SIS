import { User, Skull, HeartCrack, HeartPulse } from "lucide-react";
import { TurnoJugado } from "../types";

interface Props {
  historial: TurnoJugado[];
}

const ORDINAL = ["1°", "2°", "3°", "4°", "5°"];

export function Historial({ historial }: Props) {
  return (
    <div className="historial">
      <h2 className="historial-titulo">Historial</h2>
      {historial.length === 0 ? (
        <p className="sin-datos">Sin turnos jugados</p>
      ) : (
        <ul className="historial-lista">
          {historial.map((t, i) => {
            const siguiente = historial[i + 1];
            const evento = t.evento ?? "turno";

            if (evento === "herido" || evento === "recuperado") {
              const esRecuperado = evento === "recuperado";
              return (
                <li key={i} className={`historial-item item-evento-${evento}`}>
                  <span className="historial-icono">
                    {esRecuperado ? <HeartPulse size={12} /> : <HeartCrack size={12} />}
                  </span>
                  <span className="historial-nombre">{t.nombre}</span>
                  <span className="historial-ataque">{esRecuperado ? "recuperado" : "herido"}</span>
                </li>
              );
            }

            const cambioDeRound =
              siguiente && (siguiente.evento ?? "turno") === "turno" && siguiente.round !== t.round;
            return (
              <>
                <li key={i} className={`historial-item ${t.esJugador ? "item-jugador" : "item-enemigo"}`}>
                  <span className="historial-icono">
                    {t.esJugador ? <User size={12} /> : <Skull size={12} />}
                  </span>
                  <span className="historial-turno">T{t.turnoNumero}</span>
                  <span className="historial-nombre">{t.nombre}</span>
                  <span className="historial-ataque">
                    {ORDINAL[t.vecesJugadas - 1] ?? `${t.vecesJugadas}°`} atq
                  </span>
                </li>
                {cambioDeRound && (
                  <li key={`round-${i}`} className="historial-separador-round">
                    — Round {siguiente.round} —
                  </li>
                )}
              </>
            );
          })}
        </ul>
      )}
    </div>
  );
}
