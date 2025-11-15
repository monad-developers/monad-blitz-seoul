declare module 'react-tradingview-widget' {
  import { ComponentType } from 'react';

  interface TradingViewWidgetProps {
    symbol?: string;
    theme?: 'light' | 'dark';
    interval?: string;
    timezone?: string;
    style?: string;
    locale?: string;
    toolbar_bg?: string;
    enable_publishing?: boolean;
    hide_side_toolbar?: boolean;
    allow_symbol_change?: boolean;
    container_id?: string;
    autosize?: boolean;
    width?: number;
    height?: number;
  }

  const TradingViewWidget: ComponentType<TradingViewWidgetProps>;
  export default TradingViewWidget;
}
