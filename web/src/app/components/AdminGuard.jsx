"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminGuard({ children }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    async function validate() {
      try {
        const res = await fetch("/api/validate-admin", {
          method: "GET",
          cache: "no-store",
        });

        const json = await res.json();

        if (!json.success || json.role !== "admin") {
          router.replace("/"); // sem permissão
          return;
        }

        setAuthorized(true);
      } catch (err) {
        console.error("Erro validação admin:", err);
        router.replace("/login");
      }
    }

    validate();
  }, []);

  if (!authorized) {
    return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'black'
          }}
        >
          <svg
            className="animate-spin h-10 w-10 text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0
               c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span color="white">Validando sessão...</span>
        </div>
    );
  }

  return <>{children}</>;
}
