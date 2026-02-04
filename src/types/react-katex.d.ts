declare module 'react-katex' {
  import { ComponentType } from 'react';

  export interface InlineMathProps {
    math: string;
    children?: React.ReactNode;
  }

  export interface BlockMathProps {
    math: string;
    children?: React.ReactNode;
  }

  export const InlineMath: ComponentType<InlineMathProps>;
  export const BlockMath: ComponentType<BlockMathProps>;
}




