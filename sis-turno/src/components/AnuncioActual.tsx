import { useEffect, useState } from "react";
import { User, Skull } from "lucide-react";

interface Props {
  nombre: string | null;
  esJugador: boolean | null;
}

export function AnuncioActual({ nombre, esJugador }: Props) {
  const [animado, setAnimado] = useState(false);

  useEffect(() => {
    if (nombre) {
      setAnimado(false);
      const t = setTimeout(() => setAnimado(true), 20);
      return () => clearTimeout(t);
    }
  }, [nombre]);

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
          <p className="anuncio-subtitulo">¡Te toca!</p>
        </div>
      ) : (
        <div className="anuncio-esperando">
          <p>Esperando...</p>
        </div>
      )}
    </div>
  );
}
