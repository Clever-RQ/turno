"use client";

import { useState } from "react";
import { Campo } from "@/components/ui/campo";

type Props = Omit<React.ComponentProps<typeof Campo>, "type" | "adorno">;

export function CampoContrasena(props: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <Campo
      {...props}
      type={visible ? "text" : "password"}
      adorno={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="rounded-md px-2 py-1 font-medium text-enlace hover:text-menta focus-visible:outline-2 focus-visible:outline-esmeralda"
          aria-controls={props.name}
          aria-pressed={visible}
        >
          {visible ? "Ocultar" : "Mostrar"}
        </button>
      }
    />
  );
}
