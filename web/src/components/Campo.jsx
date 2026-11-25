import { forwardRef } from 'react';

// Input con etiqueta y mensaje de error accesible.
// forwardRef permite que el formulario le pase un useRef para hacer .focus().
const Campo = forwardRef(function Campo({ etiqueta, nombre, error, ...resto }, ref) {
  const idError = `${nombre}-error`;
  return (
    <div className="campo">
      <label htmlFor={nombre}>{etiqueta}</label>
      <input
        id={nombre}
        name={nombre}
        ref={ref}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? idError : undefined}
        {...resto}
      />
      {error && (
        <p id={idError} className="error-campo">
          {error}
        </p>
      )}
    </div>
  );
});

export default Campo;
