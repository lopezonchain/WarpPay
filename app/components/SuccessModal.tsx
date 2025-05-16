// src/components/SuccessModal.tsx
"use client";

import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import {
    FiX,
    FiCheckCircle,
    FiShare2,
    FiPlus,
} from "react-icons/fi";

interface SuccessModalProps {
    onClose: () => void;
    onShare: () => void;
    onAdd: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ onClose, onShare, onAdd }) => {
    useEffect(() => {
        confetti({
            particleCount: 100,
            spread: 60,
            origin: { y: 0.7 },
        });
    }, []);

    return (
        <div className="fixed bottom-0 inset-x-0 bg-[#0f0d14] border-t rounded-t-2xl p-6 shadow-xl z-50">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">
                    ¡Transaction completed!
                </h3>
                <button
                    onClick={onClose}
                    className="focus:outline-none"
                    aria-label="Close"
                >
                    <FiX size={24} />
                </button>
            </div>

            {/* Icon central */}
            <div className="flex justify-center mb-6">
                <FiCheckCircle size={64} className="text-green-500" />
            </div>

            {/* Botones de acción */}
            <div className="flex gap-4">
                <button
                    onClick={onShare}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition"
                >
                    <FiShare2 size={20} />
                    Share WarpPay
                </button>
                <button
                    onClick={onAdd}
                    className="flex-1 py-3 border border-gray-300 hover:border-gray-400 rounded-lg font-medium flex items-center justify-center gap-2 transition"
                >
                    <FiPlus size={20} />
                    Save Miniapp
                </button>
            </div>
        </div>
    );
};

export default SuccessModal;
