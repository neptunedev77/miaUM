import type { Role } from "@prisma/client";

// Utilizadores de teste para desenvolvimento (dados inventados).
export const devUsers: { email: string; name: string; roles: Role[] }[] = [
  { email: "aluno@example.test", name: "Ana", roles: ["USER"] },
  { email: "aluno2@example.test", name: "Bruno", roles: ["USER"] },
  { email: "staff@example.test", name: "Carla", roles: ["USER", "STAFF"] },
  { email: "admin@example.test", name: "Diogo", roles: ["USER", "ADMIN"] },
];
