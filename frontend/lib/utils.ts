export type ClassValue =
  | string
  | number
  | null
  | undefined
  | boolean
  | Record<string, boolean>
  | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];

  const push = (v: ClassValue) => {
    if (!v) return;
    if (typeof v === "string" || typeof v === "number") {
      out.push(String(v));
      return;
    }
    if (Array.isArray(v)) {
      for (const x of v) push(x);
      return;
    }
    if (typeof v === "object") {
      for (const [k, on] of Object.entries(v)) {
        if (on) out.push(k);
      }
    }
  };

  for (const i of inputs) push(i);
  return out.join(" ");
}

