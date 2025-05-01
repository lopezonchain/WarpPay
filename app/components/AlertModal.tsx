// src/components/AlertModal.tsx
import React, { useState, useEffect } from "react";

interface AlertModalProps {
  message: string;
  onClose: () => void;
}

const AlertModal: React.FC<AlertModalProps> = ({ message, onClose }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev - 2; // 100 / 50 = 2%
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
      <div className="bg-gray-800 p-4 rounded-lg w-full md:w-1/2 lg:w-1/3 mx-auto overflow-auto">
        <div className="text-white mb-4 text-center">{message}</div>
        <div
          className="h-2 bg-green-500 rounded"
          style={{ width: `${progress}%`, transition: "width 0.1s linear" }}
        />
        <button
          onClick={onClose}
          className="mt-4 w-full px-3 py-2 bg-blue-500 text-white rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default AlertModal;
