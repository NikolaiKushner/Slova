declare module "#auth-utils" {
  interface User {
    id: number;
    email: string;
    role: string; // "user" | "admin"
  }
}

export {};
