import { useEffect, useState } from "react";
import { User, Skull, Swords } from "lucide-react";

interface Props {
  nombre: string | null;
  esJugador: boolean | null;
  esperandoNuevoRound: boolean;
  round: number;
  otraVez?: boolean;
}

export function AnuncioActual({ nombre, esJugador, esperandoNuevoRound, round, otraVez }: Props) {
  const [animado, setAnimado] = useState(false);

  useEffect(() => {
    setAnimado(false);
    const t = setTimeout(() => setAnimado(true), 20);
    return () => clearTimeout(t);
  }, [nombre, esperandoNuevoRound]);

  if (esperandoNuevoRound) {
    return (
      <div className="anuncio-actual anuncio-nuevo-round">
        <div className={`anuncio-contenido ${animado ? "anuncio-fade-in" : ""}`}>
          <Swords size={40} className="anuncio-icono" />
          <p className="anuncio-nombre">ROUND {round}</p>
          <p className="anuncio-subtitulo">Ajusta participantes y pulsa siguiente</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`anuncio-actual ${esJugador === true ? "anuncio-jugador" : esJugador === false ? "anuncio-enemigo" : "anuncio-vacio"}`}
    >
      {nombre ? (
        <div className={`anuncio-contenido ${animado ? "anuncio-fade-in" : ""}`}>
          {esJugador ? (
            <User size={40} className="anuncio-icono" />
          ) : (
            <Skull size={40} className="anuncio-icono" />
          )}
          <p className="anuncio-nombre">{nombre}</p>
          <p className="anuncio-subtitulo">{otraVez ? "¡Otra vez!" : "¡Te toca!"}</p>
        </div>
      ) : (
        <div className="anuncio-esperando">
          <p>Esperando...</p>
        </div>
      )}
    </div>
  );
}
