import { ReactNode } from "react";

type ModalProps = {
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
};

export default function Modal({ onClose, title, children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center" style={{ backgroundColor: '#00000099' }}>
      <div className="bg-white rounded shadow-lg p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-black">×</button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
  