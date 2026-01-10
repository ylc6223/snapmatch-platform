declare module 'react-responsive-masonry' {
  export interface MasonryProps {
    children: React.ReactNode;
    columnsCountBreakPoints?: Record<number, number>;
    gutter?: string | number;
    className?: string;
  }

  const Masonry: React.ComponentType<MasonryProps>;
  export default Masonry;
}
