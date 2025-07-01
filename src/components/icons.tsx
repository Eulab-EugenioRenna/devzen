import type { SVGProps } from "react";

export const Icons = {
  logo: (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 4h8a4 4 0 0 1 4 4v12a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-4" />
      <path d="M20 12V8a4 4 0 0 0-4-4H8" />
    </svg>
  ),
};
