import { useWindowDimensions } from 'react-native';

/** Tela larga (computador ou tablet deitado): menu na lateral e duas colunas. */
export const WIDE = 900;
export const useWide = () => useWindowDimensions().width >= WIDE;
