// components/AlertModal.js

import React, { useState, useEffect } from "react";

function AlertModal({ message, onClose }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Disminuye la barra en 5 segundos (50 ticks de 100 ms)
    const interval = setInterval(() => {
      setProgress((prev) => {
        const decrement = 100 / 50;
        const next = prev - decrement;
        if (next <= 0) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [onClose]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
      <div className="bg-gray-800 p-4 rounded-lg w-80">
        {/* Mensaje en la parte superior */}
        <div className="text-white mb-4 text-center">{message}</div>
        {/* Barra de progreso */}
        <div
          className="w-full h-2 bg-green-500"
          style={{ width: `${progress}%`, transition: "width 0.1s linear" }}
        ></div>
        {/* Botón debajo, ocupando el ancho completo */}
        <button
          onClick={onClose}
          className="mt-4 w-full px-3 py-2 bg-blue-500 text-white rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default AlertModal;
